const express = require('express');
const router  = express.Router();
const pool    = require('../db/db');
const multer  = require('multer');
const path    = require('path');
const { verifyToken, adminOnly } = require('../middleware/auth');

// ─── Multer: maintenance image upload ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `maintenance_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── GET /api/maintenance ────────────────────────────────────────────────────
// Admin: all | Student: own requests
router.get('/', verifyToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT m.*, u.name as student_name, u.student_number,
                r.room_number, r.block
         FROM maintenance_requests m
         JOIN users u ON m.user_id = u.id
         LEFT JOIN rooms r ON m.room_id = r.id
         ORDER BY m.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT m.*, r.room_number, r.block
         FROM maintenance_requests m
         LEFT JOIN rooms r ON m.room_id = r.id
         WHERE m.user_id = $1
         ORDER BY m.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Get maintenance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/maintenance ───────────────────────────────────────────────────
// Student submits a maintenance request with optional image
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  const { title, description, room_id } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO maintenance_requests (user_id, room_id, title, description, image_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, room_id || null, title, description, image_path]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create maintenance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/maintenance/:id/status ─────────────────────────────────────────
// Admin updates maintenance request status
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'in_progress', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const result = await pool.query(
      'UPDATE maintenance_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update maintenance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/maintenance/:id ─────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });

    const request = check.rows[0];
    if (req.user.role !== 'admin' && request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [req.params.id]);
    res.json({ message: 'Maintenance request deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/maintenance/stats ──────────────────────────────────────────────
// Dashboard stats for admin
router.get('/stats', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count FROM maintenance_requests GROUP BY status`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const pool    = require('../db/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// ─── GET /api/rooms ──────────────────────────────────────────────────────────
// All authenticated users can view rooms
router.get('/', verifyToken, async (req, res) => {
  try {
    const { block, type, status } = req.query;
    let query  = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (block)  { params.push(block);  query += ` AND block = $${params.length}`; }
    if (type)   { params.push(type);   query += ` AND type = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }

    query += ' ORDER BY block, room_number';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/rooms/:id ──────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/rooms ─────────────────────────────────────────────────────────
// Admin only
router.post('/', verifyToken, adminOnly, async (req, res) => {
  const { room_number, block, type, capacity, price_per_month, amenities, status } = req.body;

  if (!room_number || !block || !type || !capacity || !price_per_month) {
    return res.status(400).json({ error: 'room_number, block, type, capacity, and price_per_month are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rooms (room_number, block, type, capacity, price_per_month, amenities, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [room_number, block, type, capacity, price_per_month, amenities || '', status || 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Room number already exists.' });
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/rooms/:id ──────────────────────────────────────────────────────
// Admin only
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  const { room_number, block, type, capacity, price_per_month, amenities, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rooms SET room_number=$1, block=$2, type=$3, capacity=$4,
       price_per_month=$5, amenities=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [room_number, block, type, capacity, price_per_month, amenities, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/rooms/:id ───────────────────────────────────────────────────
// Admin only
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found.' });
    res.json({ message: 'Room deleted successfully.' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

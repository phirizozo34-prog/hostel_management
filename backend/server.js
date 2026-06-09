const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/rooms',       require('./routes/rooms'));
app.use('/api/bookings',    require('./routes/bookings'));
app.use('/api/maintenance', require('./routes/maintenance'));

// ─── Dashboard stats endpoint ────────────────────────────────────────────────
const pool = require('./db/db');
const { verifyToken } = require('./middleware/auth');

app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      const [rooms, bookings, students, maintenance] = await Promise.all([
        pool.query(`SELECT
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'full')      as full,
          COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
          COUNT(*) as total
          FROM rooms`),
        pool.query(`SELECT
          COUNT(*) FILTER (WHERE status = 'pending')  as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) as total
          FROM bookings`),
        pool.query(`SELECT COUNT(*) as total FROM users WHERE role = 'student'`),
        pool.query(`SELECT
          COUNT(*) FILTER (WHERE status = 'open')        as open,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'resolved')    as resolved
          FROM maintenance_requests`),
      ]);

      res.json({
        rooms:       rooms.rows[0],
        bookings:    bookings.rows[0],
        students:    students.rows[0],
        maintenance: maintenance.rows[0],
      });
    } else {
      // Student-specific stats
      const [myBookings, myMaintenance] = await Promise.all([
        pool.query(`SELECT
          COUNT(*) FILTER (WHERE status = 'pending')  as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) as total
          FROM bookings WHERE user_id = $1`, [req.user.id]),
        pool.query(`SELECT COUNT(*) as total FROM maintenance_requests WHERE user_id = $1`, [req.user.id]),
      ]);

      res.json({
        bookings:    myBookings.rows[0],
        maintenance: myMaintenance.rows[0],
      });
    }
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Hostel Management API running on http://localhost:${PORT}`);
});

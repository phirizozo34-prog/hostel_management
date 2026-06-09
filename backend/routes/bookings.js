const express = require('express');
const router  = express.Router();
const pool    = require('../db/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// ─── GET /api/bookings ───────────────────────────────────────────────────────
// Admin: all bookings | Student: own bookings only
router.get('/', verifyToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT b.*, u.name as student_name, u.email as student_email,
                u.student_number, r.room_number, r.block, r.type, r.price_per_month
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN rooms r ON b.room_id = r.id
         ORDER BY b.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT b.*, r.room_number, r.block, r.type, r.price_per_month, r.amenities
         FROM bookings b
         JOIN rooms r ON b.room_id = r.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/bookings/:id ───────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as student_name, u.email, u.student_number,
              r.room_number, r.block, r.type, r.price_per_month
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found.' });

    const booking = result.rows[0];
    // Students can only view their own bookings
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/bookings ──────────────────────────────────────────────────────
// Students book a room
router.post('/', verifyToken, async (req, res) => {
  const { room_id, check_in_date, check_out_date, notes } = req.body;

  if (!room_id || !check_in_date || !check_out_date) {
    return res.status(400).json({ error: 'room_id, check_in_date, and check_out_date are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check room exists and has space
    const roomResult = await client.query(
      'SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [room_id]
    );
    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Room not found.' });
    }
    const room = roomResult.rows[0];
    if (room.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Room is not available for booking.' });
    }
    if (room.occupied >= room.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Room is fully occupied.' });
    }

    // Check for existing active booking by this user
    const existingBooking = await client.query(
      `SELECT id FROM bookings WHERE user_id = $1 AND status IN ('pending', 'approved')`,
      [req.user.id]
    );
    if (existingBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have an active booking.' });
    }

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, room_id, check_in_date, check_out_date, notes || null]
    );

    await client.query('COMMIT');
    res.status(201).json(bookingResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── PUT /api/bookings/:id/status ────────────────────────────────────────────
// Admin approves or rejects bookings
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
  const { status, payment_status } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'checked_out'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingResult.rows[0];
    const oldStatus = booking.status;

    // Update booking status
    const updated = await client.query(
      `UPDATE bookings SET status=$1, payment_status=COALESCE($2, payment_status)
       WHERE id=$3 RETURNING *`,
      [status, payment_status || null, req.params.id]
    );

    // Update room occupancy when approving or rejecting
    if (status === 'approved' && oldStatus !== 'approved') {
      await client.query(
        `UPDATE rooms SET occupied = occupied + 1,
         status = CASE WHEN occupied + 1 >= capacity THEN 'full' ELSE 'available' END
         WHERE id = $1`,
        [booking.room_id]
      );
    } else if ((status === 'rejected' || status === 'checked_out') && oldStatus === 'approved') {
      await client.query(
        `UPDATE rooms SET occupied = GREATEST(occupied - 1, 0),
         status = CASE WHEN status = 'full' THEN 'available' ELSE status END
         WHERE id = $1`,
        [booking.room_id]
      );
    }

    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── DELETE /api/bookings/:id ────────────────────────────────────────────────
// Student cancels their own pending booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found.' });

    const booking = bookingResult.rows[0];
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (booking.status !== 'pending') {
      return res.status(409).json({ error: 'Only pending bookings can be cancelled.' });
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

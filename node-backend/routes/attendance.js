const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/attendance - Get attendance records for a specific date
// URL parameter: ?date=YYYY-MM-DD (defaults to today's date in local time)
router.get('/', (req, res) => {
  let date = req.query.date;
  if (!date) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    date = localToday.toISOString().split('T')[0];
  }

  try {
    // Left join students with attendance on the specific date.
    // If no attendance record exists, we default the status to 'Absent'.
    const records = db.prepare(`
      SELECT 
        s.id as student_id,
        s.name,
        s.roll_no,
        s.class,
        s.parent_phone,
        COALESCE(a.status, 'Absent') as status,
        COALESCE(a.date, ?) as date
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      ORDER BY s.name ASC
    `).all(date, date);
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/attendance/student/:id - Get attendance history for a single student
router.get('/student/:id', (req, res) => {
  const studentId = req.params.id;
  try {
    const history = db.prepare(`
      SELECT date, status 
      FROM attendance 
      WHERE student_id = ? 
      ORDER BY date DESC
    `).all(studentId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/attendance - Upsert attendance (manual updates from UI)
router.post('/', (req, res) => {
  const { student_id, date, status } = req.body;
  if (!student_id || !date || !status) {
    return res.status(400).json({ error: 'student_id, date, and status are required.' });
  }
  if (status !== 'Present' && status !== 'Absent') {
    return res.status(400).json({ error: "status must be either 'Present' or 'Absent'." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO attendance (student_id, date, status)
      VALUES (?, ?, ?)
      ON CONFLICT(student_id, date) 
      DO UPDATE SET status = excluded.status
    `);
    stmt.run(student_id, date, status);
    res.json({ success: true, student_id, date, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

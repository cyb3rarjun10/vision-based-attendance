const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/exams - List all exams
router.get('/', (req, res) => {
  try {
    const exams = db.prepare('SELECT * FROM exams ORDER BY date DESC').all();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/exams - Create a new exam
router.post('/', (req, res) => {
  const { subject, date, class: className, max_marks } = req.body;
  if (!subject || !date || !className || !max_marks) {
    return res.status(400).json({ error: 'All fields (subject, date, class, max_marks) are required.' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO exams (subject, date, class, max_marks) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(subject, date, className, parseInt(max_marks, 10));
    res.status(201).json({
      id: info.lastInsertRowid,
      subject,
      date,
      class: className,
      max_marks: parseInt(max_marks, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

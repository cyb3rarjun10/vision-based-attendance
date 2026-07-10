const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/performance - List all performance records (joined with students and exams)
router.get('/', (req, res) => {
  try {
    const performance = db.prepare(`
      SELECT 
        p.id, 
        p.marks, 
        p.student_id, 
        s.name as student_name, 
        s.roll_no as student_roll_no,
        p.exam_id, 
        e.subject, 
        e.date, 
        e.max_marks
      FROM performance p
      JOIN students s ON p.student_id = s.id
      JOIN exams e ON p.exam_id = e.id
      ORDER BY e.date DESC, s.name ASC
    `).all();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/performance - Create or update performance score
router.post('/', (req, res) => {
  const { student_id, exam_id, marks } = req.body;
  if (student_id === undefined || exam_id === undefined || marks === undefined) {
    return res.status(400).json({ error: 'student_id, exam_id, and marks are required.' });
  }

  try {
    // Verify exam exists and get max marks to validate
    const exam = db.prepare('SELECT max_marks FROM exams WHERE id = ?').get(exam_id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    if (parseInt(marks, 10) > exam.max_marks || parseInt(marks, 10) < 0) {
      return res.status(400).json({ error: `Marks must be between 0 and the maximum limit of ${exam.max_marks}.` });
    }

    const stmt = db.prepare(`
      INSERT INTO performance (student_id, exam_id, marks)
      VALUES (?, ?, ?)
      ON CONFLICT(student_id, exam_id) 
      DO UPDATE SET marks = excluded.marks
    `);
    stmt.run(parseInt(student_id, 10), parseInt(exam_id, 10), parseInt(marks, 10));
    res.json({ success: true, student_id, exam_id, marks: parseInt(marks, 10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/performance/student/:id - Get performance history for a student
router.get('/student/:id', (req, res) => {
  const studentId = req.params.id;
  try {
    const history = db.prepare(`
      SELECT 
        p.id, 
        p.marks, 
        e.id as exam_id, 
        e.subject, 
        e.date, 
        e.max_marks
      FROM performance p
      JOIN exams e ON p.exam_id = e.id
      WHERE p.student_id = ?
      ORDER BY e.date DESC
    `).all(studentId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/students - List all students
router.get('/', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students - Add a new student
router.post('/', (req, res) => {
  const { name, roll_no, class: className, parent_phone } = req.body;
  if (!name || !roll_no || !className || !parent_phone) {
    return res.status(400).json({ error: 'All fields (name, roll_no, class, parent_phone) are required.' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO students (name, roll_no, class, parent_phone) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(name, roll_no, className, parent_phone);
    res.status(201).json({
      id: info.lastInsertRowid,
      name,
      roll_no,
      class: className,
      parent_phone
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Roll number already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

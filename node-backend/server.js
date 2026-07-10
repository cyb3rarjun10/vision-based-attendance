const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./db'); // Import to ensure SQLite connection & schema are initialized

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Bind API routes
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/performance', require('./routes/performance'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Node.js Express REST API' });
});

// Run server
app.listen(PORT, () => {
  console.log(`Node.js Express server running on http://localhost:${PORT}`);
});

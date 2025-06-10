require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Neon DB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Optional root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Library Management System API',
    endpoints: [
      '/genres', '/genres/:id',
      '/authors', '/authors/:id',
      '/publishers', '/publishers/:id',
      '/categories', '/categories/:id',
      '/books', '/books/:id',
      '/members', '/members/:id',
      '/loans', '/loans/:id',
      '/fines', '/fines/:id',
      '/reservations', '/reservations/:id',
      '/librarystaff', '/librarystaff/:id',
      '/reports/recent-loans'
    ]
  });
});

// Helper function for GET endpoints
const createGetEndpoints = (tableName, idColumn) => {
  app.get(`/${tableName.toLowerCase()}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(`/${tableName.toLowerCase()}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: `${tableName} not found` });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

// Create endpoints for all tables
createGetEndpoints('Genres', 'GenreID');
createGetEndpoints('Authors', 'AuthorID');
createGetEndpoints('Publishers', 'PublisherID');
createGetEndpoints('Categories', 'CategoryID');
createGetEndpoints('Books', 'BookID');
createGetEndpoints('Members', 'MemberID');
createGetEndpoints('Loans', 'LoanID');
createGetEndpoints('Fines', 'FineID');
createGetEndpoints('Reservations', 'ReservationID');
createGetEndpoints('LibraryStaff', 'StaffID');

// Report endpoint
app.get('/reports/recent-loans', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.Title, m.Name, l.IssueDate
      FROM Books b
      JOIN Loans l ON b.BookID = l.BookID
      JOIN Members m ON l.MemberID = m.MemberID
      WHERE l.IssueDate >= CURRENT_DATE - INTERVAL '30 days'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const cors = require('cors');
app.use(cors());
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
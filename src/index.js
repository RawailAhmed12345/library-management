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

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully');
  }
  release();
});

// Optional root route
app.get('/', (req, res) => {
  console.log('Handling request for', req.path);
  res.set('Content-Type', 'application/json');
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
  app.get(`/${tableName.toLowerCase()}`, (req, res) => {
    console.log('Handling request for', req.path);
    try {
      const result = pool.query(`SELECT * FROM ${tableName}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(`/${tableName.toLowerCase()}/:id`, (req, res) => {
    console.log('Handling request for', req.path);
    try {
      const { id } = req.params;
      const result = pool.query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
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
app.get('/reports/recent-loans', (req, res) => {
  console.log('Handling request for', req.path);
  try {
    const result = pool.query(`
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

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
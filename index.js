require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Initialize PostgreSQL connection to Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to create GET endpoints for a table
const createGetEndpoints = (authors, idColumn) => {
  // GET all records
  app.get(`/${authors.toLowerCase()}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${authors}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET record by ID
  app.get(`/${authors.toLowerCase()}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`SELECT * FROM ${authors} WHERE ${idColumn} = $1`, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `${authors} not found` });
      }
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

// Create GET endpoints for all tables
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

// Report endpoint for recent loans
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Init DB
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        capital DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        date VARCHAR(255),
        asset VARCHAR(255),
        setup VARCHAR(255),
        direction VARCHAR(10),
        entry DECIMAL(10, 4),
        sl DECIMAL(10, 4),
        tp DECIMAL(10, 4),
        rr DECIMAL(10, 2),
        resultUSD DECIMAL(10, 2),
        leverage DECIMAL(5, 2),
        comment TEXT,
        screenshot LONGTEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, password]
    );
    res.json({ success: true, user_id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, user_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/accounts/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { user_id, name, capital } = req.body;
    const result = await pool.query(
      'INSERT INTO accounts (user_id, name, capital) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, capital]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE account_id = $1', [req.params.id]);
    await pool.query('DELETE FROM accounts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trades/:account_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trades WHERE account_id = $1 ORDER BY date DESC',
      [req.params.account_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trades', async (req, res) => {
  try {
    const { account_id, date, asset, setup, direction, entry, sl, tp, rr, resultUSD, leverage, comment, screenshot } = req.body;
    const result = await pool.query(
      'INSERT INTO trades (account_id, date, asset, setup, direction, entry, sl, tp, rr, resultUSD, leverage, comment, screenshot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [account_id, date, asset, setup, direction, entry, sl, tp, rr, resultUSD, leverage, comment, screenshot]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trades/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on port ${PORT}`);
});

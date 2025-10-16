const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const db = new sqlite3.Database('./db.js');

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
    if (err) return res.status(400).json({ error: 'User already exists' });
    res.json({ user_id: this.lastID });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user_id: row.id });
  });
});

// Get accounts
app.get('/api/accounts/:userId', (req, res) => {
  db.all('SELECT * FROM accounts WHERE user_id = ?', [req.params.userId], (err, rows) => {
    res.json(rows || []);
  });
});

// Create account
app.post('/api/accounts', (req, res) => {
  const { user_id, name, capital } = req.body;
  db.run('INSERT INTO accounts (user_id, name, capital) VALUES (?, ?, ?)', [user_id, name, capital], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, user_id, name, capital });
  });
});

// Get trades
app.get('/api/trades/:accountId', (req, res) => {
  db.all('SELECT * FROM trades WHERE account_id = ?', [req.params.accountId], (err, rows) => {
    res.json(rows || []);
  });
});

// Create trade
app.post('/api/trades', (req, res) => {
  const { account_id, date, asset, direction, entry, sl, tp, resultUSD, comment, screenshot } = req.body;
  db.run(
    'INSERT INTO trades (account_id, date, asset, direction, entry, sl, tp, resultUSD, comment, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [account_id, date, asset, direction, entry, sl, tp, resultUSD, comment, screenshot],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, account_id, date, asset, direction, entry, sl, tp, resultUSD, comment });
    }
  );
});

// Delete trade
app.delete('/api/trades/:id', (req, res) => {
  db.run('DELETE FROM trades WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete account
app.delete('/api/accounts/:id', (req, res) => {
  db.run('DELETE FROM trades WHERE account_id = ?', [req.params.id], (err1) => {
    if (err1) return res.status(400).json({ error: err1.message });
    db.run('DELETE FROM accounts WHERE id = ?', [req.params.id], (err2) => {
      if (err2) return res.status(400).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

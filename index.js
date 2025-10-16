const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// In-memory database
let users = [];
let accounts = [];
let trades = [];
let nextUserId = 1;
let nextAccountId = 1;
let nextTradeId = 1;

// Routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username exists' });
  users.push({ id: nextUserId++, username, password });
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid' });
  res.json({ success: true, user_id: user.id });
});

app.get('/api/accounts/:user_id', (req, res) => {
  res.json(accounts.filter(a => a.user_id == req.params.user_id));
});

app.post('/api/accounts', (req, res) => {
  const { user_id, name, capital } = req.body;
  const acc = { id: nextAccountId++, user_id, name, capital };
  accounts.push(acc);
  res.json(acc);
});

app.delete('/api/accounts/:id', (req, res) => {
  accounts = accounts.filter(a => a.id != req.params.id);
  trades = trades.filter(t => t.account_id != req.params.id);
  res.json({ success: true });
});

app.get('/api/trades/:account_id', (req, res) => {
  res.json(trades.filter(t => t.account_id == req.params.account_id));
});

app.post('/api/trades', (req, res) => {
  const trade = { id: nextTradeId++, ...req.body };
  trades.push(trade);
  res.json(trade);
});

app.delete('/api/trades/:id', (req, res) => {
  trades = trades.filter(t => t.id != req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

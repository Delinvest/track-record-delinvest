const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Données en mémoire (à remplacer par une vraie DB)
let users = [];
let accounts = [];
let trades = [];
let nextUserId = 1;
let nextAccountId = 1;
let nextTradeId = 1;

// Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Utilisateur existe déjà' });
    }
    const user = { id: nextUserId++, username, password };
    users.push(user);
    res.json({ user_id: user.id });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    res.json({ user_id: user.id });
});

// Get accounts
app.get('/api/accounts/:userId', (req, res) => {
    const userAccounts = accounts.filter(a => a.user_id == req.params.userId);
    res.json(userAccounts);
});

// Create account
app.post('/api/accounts', (req, res) => {
    const { user_id, name, capital } = req.body;
    const account = { id: nextAccountId++, user_id, name, capital };
    accounts.push(account);
    res.json(account);
});

// Get trades
app.get('/api/trades/:accountId', (req, res) => {
    const accountTrades = trades.filter(t => t.account_id == req.params.accountId);
    res.json(accountTrades);
});

// Create trade
app.post('/api/trades', (req, res) => {
    const { account_id, date, asset, direction, entry, sl, tp, resultUSD, comment, screenshot } = req.body;
    const trade = {
        id: nextTradeId++,
        account_id,
        date,
        asset,
        direction,
        entry: parseFloat(entry),
        sl: parseFloat(sl),
        tp: parseFloat(tp),
        resultUSD: parseFloat(resultUSD),
        comment,
        screenshot
    };
    trades.push(trade);
    res.json(trade);
});

// Delete trade
app.delete('/api/trades/:id', (req, res) => {
    trades = trades.filter(t => t.id != req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

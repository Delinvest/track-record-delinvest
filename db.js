const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'trading.db'), (err) => {
    if (err) console.error('Error opening database:', err);
    else console.log('Connected to SQLite database');
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            capital REAL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            date TEXT,
            asset TEXT,
            direction TEXT,
            entry REAL,
            sl REAL,
            tp REAL,
            resultUSD REAL,
            comment TEXT,
            screenshot TEXT,
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        )
    `);
});

module.exports = db;


const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'madisen.murazik@ethereal.email',
        pass: 'J2g6P6yE1kFwV6C8Jb'
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires INTEGER NOT NULL
    )`);
});

app.post('/signup', (req, res) => {
    const { fName, lName, email, password } = req.body;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const sql = `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`;
        const params = [fName, lName, email, hash];
        db.run(sql, params, function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const mailOptions = {
                from: 'yourapp@example.com',
                to: email,
                subject: 'Welcome to Our Platform!',
                text: `Hi ${fName}, thank you for signing up!`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
                }
            });

            res.json({
                message: 'success',
                id: this.lastID
            });
        });
    });
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (result) {
                res.json({ message: 'success' });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.post('/recover', (req, res) => {
    const { email } = req.body;
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        db.run(`INSERT INTO password_resets (email, token, expires) VALUES (?, ?, ?)`, [email, token, expires], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating reset token' });
            }
            // In a real app, you would email this link
            console.log(`Password reset link: http://localhost:${port}/reset.html?token=${token}`);
            res.json({ message: 'Password reset link sent' });
        });
    });
});

app.post('/reset', (req, res) => {
    const { token, password } = req.body;
    const sql = `SELECT * FROM password_resets WHERE token = ? AND expires > ?`;
    db.get(sql, [token, Date.now()], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password' });
            }
            db.run(`UPDATE users SET password = ? WHERE email = ?`, [hash, row.email], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error updating password' });
                }
                db.run(`DELETE FROM password_resets WHERE token = ?`, [token]);
                res.json({ message: 'Password has been reset' });
            });
        });
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
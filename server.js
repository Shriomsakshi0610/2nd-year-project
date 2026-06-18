const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite Database
const db = new sqlite3.Database('./library.db', (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.serialize(() => {
    // Books table
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            isbn TEXT UNIQUE,
            quantity INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Members table
    db.run(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            membership_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Issue records table
    db.run(`
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            return_date DATETIME,
            status TEXT DEFAULT 'Issued',
            FOREIGN KEY(book_id) REFERENCES books(id),
            FOREIGN KEY(member_id) REFERENCES members(id)
        )
    `);
});

// ==================== BOOK ENDPOINTS ====================

// Get all books
app.get('/api/books', (req, res) => {
    db.all('SELECT * FROM books ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new book
app.post('/api/books', (req, res) => {
    const { title, author, isbn, quantity } = req.body;

    if (!title || !author) {
        return res.status(400).json({ error: 'Title and Author are required' });
    }

    db.run(
        'INSERT INTO books (title, author, isbn, quantity) VALUES (?, ?, ?, ?)',
        [title, author, isbn || null, quantity || 1],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ 
                    message: 'Book added successfully', 
                    id: this.lastID 
                });
            }
        }
    );
});

// Delete book
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Book deleted successfully' });
        }
    });
});

// Update book
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, quantity, status } = req.body;

    db.run(
        'UPDATE books SET title = ?, author = ?, isbn = ?, quantity = ?, status = ? WHERE id = ?',
        [title, author, isbn, quantity, status, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ message: 'Book updated successfully' });
            }
        }
    );
});

// ==================== MEMBER ENDPOINTS ====================

// Get all members
app.get('/api/members', (req, res) => {
    db.all('SELECT * FROM members ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new member
app.post('/api/members', (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
    }

    db.run(
        'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone || null],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    res.status(400).json({ error: 'Email already exists' });
                } else {
                    res.status(500).json({ error: err.message });
                }
            } else {
                res.json({ 
                    message: 'Member added successfully', 
                    id: this.lastID 
                });
            }
        }
    );
});

// ==================== ISSUE ENDPOINTS ====================

// Get all issues
app.get('/api/issues', (req, res) => {
    const query = `
        SELECT i.*, b.title, b.author, m.name, m.email 
        FROM issues i
        LEFT JOIN books b ON i.book_id = b.id
        LEFT JOIN members m ON i.member_id = m.id
        ORDER BY i.issue_date DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Issue a book
app.post('/api/issues', (req, res) => {
    const { book_id, member_id } = req.body;

    if (!book_id || !member_id) {
        return res.status(400).json({ error: 'Book ID and Member ID are required' });
    }

    db.run(
        'INSERT INTO issues (book_id, member_id, status) VALUES (?, ?, "Issued")',
        [book_id, member_id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                // Update book quantity
                db.run('UPDATE books SET quantity = quantity - 1, status = "Issued" WHERE id = ?', [book_id]);
                res.json({ 
                    message: 'Book issued successfully', 
                    id: this.lastID 
                });
            }
        }
    );
});

// Return a book
app.put('/api/issues/:id/return', (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE issues SET status = "Returned", return_date = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                // Fetch the book_id to update quantity
                db.get('SELECT book_id FROM issues WHERE id = ?', [id], (err, row) => {
                    if (row) {
                        db.run('UPDATE books SET quantity = quantity + 1, status = "Available" WHERE id = ?', [row.book_id]);
                    }
                    res.json({ message: 'Book returned successfully' });
                });
            }
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

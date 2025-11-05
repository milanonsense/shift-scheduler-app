const dayjs = require('dayjs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to SQLite
const db = new sqlite3.Database('./shifts.db', (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite DB.');
});

//tables initializing

// Users table for login/roles
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL
  )
`);

// Employees table
db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

// Shifts table
db.run(`
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    UNIQUE(date, start_time)
  )
`);

// Add a default manager user
db.run(
  `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
  ['manager1', 'password123', 'manager']
);

//authentication middleware 
function authenticate(req, res, next) {
  const username = req.headers['x-username'];
  const role = req.headers['x-role'];

  if (!username || !role) {
    return res.status(401).json({ error: 'Unauthorized - missing credentials' });
  }

  req.user = { username, role };
  next();
}

function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Access denied - manager only' });
  }
  next();
}

//Login routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid credentials' });

      
      res.json({ username: row.username, role: row.role });
    }
  );
});

//EMPLOYEE ROUTES

// Get all employees
app.get('/api/employees', (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add employee (only manager)
app.post('/api/employees', authenticate, requireManager, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  db.run('INSERT INTO employees (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

// Delete employee (only manager)
app.delete('/api/employees/:id', authenticate, requireManager, (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

//shift routes

// Get all shifts
app.get('/api/shifts', (req, res) => {
  db.all('SELECT * FROM shifts', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get shifts for a specific week
app.get('/api/shifts/week', (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: 'Missing week parameter' });

  const start = dayjs(week).startOf('week').add(1, 'day'); // Monday
  const end = start.add(6, 'day'); // Sunday

  db.all(
    `SELECT * FROM shifts WHERE date BETWEEN ? AND ?`,
    [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Add/update shift (only manager)
app.post('/api/shifts', authenticate, requireManager, (req, res) => {
  const { date, start_time, end_time, employee_name } = req.body;

  const query = `
    INSERT INTO shifts (employee_name, date, start_time, end_time)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date, start_time)
    DO UPDATE SET employee_name = excluded.employee_name,
                  end_time = excluded.end_time
  `;

  db.run(query, [employee_name, date, start_time, end_time], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === SERVER START ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

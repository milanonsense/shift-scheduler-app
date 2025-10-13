const dayjs = require('dayjs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Connect to SQLite
const db = new sqlite3.Database('./shifts.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite DB.');
});

//endpoints
app.get('/api/shifts', (req, res) => {
  db.all('SELECT * FROM shifts', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/employees', (req, res) => {
  db.all('SELECT name FROM employees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/shifts', (req, res) => {
  const { date, start_time, end_time, employee_name } = req.body;

  const query = `
    INSERT INTO shifts (employee_name, date, start_time, end_time)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date, start_time) DO UPDATE SET employee_name = excluded.employee_name
  `;

  db.run(query, [employee_name, date, start_time, end_time], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


app.get('/api/shifts', (req, res) => {
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

//to start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

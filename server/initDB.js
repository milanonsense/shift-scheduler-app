const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./shifts.db');

//Create employee table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      UNIQUE(date, start_time) -- for upsert
    )
  `);

  const insert = db.prepare('INSERT OR IGNORE INTO employees (name) VALUES (?)');
  for (let i = 1; i <= 31; i++) {
    insert.run(`Employee ${i}`);
  }
  insert.finalize();

  console.log('Database initialized with employees and shifts table.');
});

db.close();

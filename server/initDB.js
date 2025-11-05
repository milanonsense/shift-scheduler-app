const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./shifts.db');

db.serialize(() => {
  // Create employees table
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Create shifts table
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      UNIQUE(date, start_time)
    )
  `);

  // Creates users table (for login + roles)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL
    )
  `);

  //default manager user
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES (?, ?, ?)
  `);

  //always at least one manager in database
  insertUser.run('manager1', 'password123', 'manager');
  insertUser.finalize();

  // Insert example employees (if not already there)
  const insertEmp = db.prepare('INSERT OR IGNORE INTO employees (name) VALUES (?)');
  for (let i = 1; i <= 31; i++) {
    insertEmp.run(`Employee ${i}`);
  }
  insertEmp.run('Mike the Manager');
  insertEmp.finalize();
//initializing is complete
  console.log('✅ Database initialized with users, employees, and shifts tables.');
});

db.close();

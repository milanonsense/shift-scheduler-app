const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs') //library for hashing passwords

(async () => {
  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10); //uses the library to has the password with 10 (random numba for security)

  //the string is stored in my sql database and even if its hacked it wont show the actual password because of the hashing
  
  const db = new sqlite3.Database('./shifts.db'); //basically just opens my dtabase

  //all these live inside my sql database 
  
  db.serialize(() => {
    //stores work shifts who's working and when
    db.run(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        UNIQUE(date, start_time, employee_id),
        FOREIGN KEY(employee_id) REFERENCES users(id)
)
    `);

    //stories login and authentication and all those details but password will be hashed 
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL
      )
    `);

    // adds a default manager into database 
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `)
    insertUser.run('manager1', 'manager1@example.com', hashedPassword, 'manager')
    insertUser.finalize()
    
    console.log('Database initialized.')
  })

  // Closes sql database 
  db.close((err) => {
    if (err) console.error('Issue closing', err.message)
    else console.log('connection closed')
  })
})()

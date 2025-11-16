const dayjs = require("dayjs")
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")
const bcrypt = require("bcryptjs")
const session = require("express-session")
const SQLiteStore = require("connect-sqlite3")(session)

const app = express()
const PORT = 5000

//lets frontend talk to backend - credentials true basically allows cookies/sessions to be sent
app.use(cors({ origin: "http://localhost:3000", credentials: true }))
app.use(express.json()) //express can read json requests

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite" }), //stores sessions in sqlite
    secret: "superdoopersecret", //secret to sign cookies
    resave: false, //dont save session if nothing changes
    saveUninitialized: false, 
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, //cookie lasts 2 hours then logs you out
  })
)
//connects to sqllite database
const db = new sqlite3.Database('./shifts.db', (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to SQLite");
});
//helps run sql w promises basically like a real promise it will happen but not immediately
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => { //resolve = success, reject = error
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.lastID); //return id of new row
    })
  })
};
//makes usr tables in sql
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL
  )
`);

//creates shift tables in sql
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

// Create default manager
(async () => {
  const hashed = await bcrypt.hash("password123", 10)
  //inserts if it doesnt already exist
  db.run(
    `INSERT OR IGNORE INTO users (username, email, password, role)
     VALUES (?, ?, ?, 'manager')`,
    ["manager1", "manager1@example.com", hashed]
  )
})()

function authenticate(req, res, next) {
  //if user is not stored in the session then not logged in 
  if (!req.session.user) { //if its not a requested user w the session then somethings wrong
    return res.status(401).json({ error: "Unauthorized" })
  }
  req.user = req.session.user //saves the session request if user is stored in session and logged in
  next()
}
//only managers 
function requireManager(req, res, next) {
  if (req.user.role !== "manager") { //if the requested user is not a manager then issue
    return res.status(403).json({ error: "Sorry Managers Only" })
  }
  next()
}
//does the login 
app.post("/api/login", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) //if nothing is inputted show this error
    return res.status(400).json({ error: "Username and password required" })
  //looks up the user in db
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!user) return res.status(401).json({ error: "Invalid credentials- wrong username" }) //if its not a user in the user table theres a issue
    //checks the password with the bycrypted password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials- wrong password" }) //if it doesnt match its a issue
  //saves the info to sessions if they are logged in
    req.session.user = {
      id: user.id, //saves they id
      username: user.username, //saves they username
      role: user.role, //saves they role
    }

    res.json({ username: user.username, role: user.role }) //changes it to javascript so easy to read
  })
})

//registering a new user
app.post("/api/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) //if everything is empty its an issue
    return res.status(400).json({ error: "All fields required" })
  if (!["manager", "employee"].includes(role)) //if its not a manager or employee its an issue
    return res.status(400).json({ error: "Invalid role" })
//checks if username and email already exists in sql db
  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [username, email],
    async (err, existing) => {
      if (err) return res.status(500).json({ error: err.message })

      if (existing) //if it exists then its a conflict
        return res.status(409).json({ error: "Username or email already exists" })

      const hashedPassword = await bcrypt.hash(password, 10) //hash the pass
      //insert a new user into the sql db
      db.run(
        `INSERT INTO users (username, email, password, role)
         VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, role],
        function (err) {
          if (err) return res.status(500).json({ error: err.message })
            //logs in the user after registering via the session
          req.session.user = {
            id: this.lastID,
            username,
            role,
          }

          res.json({ message: "Registered", username, role }) //makes a registered message
        }
      )
    }
  )
})
//logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }))
})

//gets the logged in user currently via sessions
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" }) //if the user is not in the session then they are not logged in
  res.json(req.session.user)
})
//gets all employees from sql db- for managers 
app.get("/api/employees", authenticate, requireManager, (req, res) => {
  db.all(
    "SELECT id, username, email FROM users WHERE role = 'employee'",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
})
//creates a new employee - manager only
app.post("/api/employees", authenticate, requireManager, async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) { //if nothing inputed then conflict
    return res.status(400).json({ error: "Username, email and password required" })
  }

  try {
    const hashed = await bcrypt.hash(password, 10)
    //inserts the new employee into sql db
    db.run(
      `
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, 'employee')
      `,
      [username, email, hashed],
      function (err) {
        if (err) { //any errors with username and email if its not unique 
          if (err.message.includes("UNIQUE failed")) {
            if (err.message.includes("users.username")) {
              return res.status(409).json({ error: "Username already exists" })
            }
            if (err.message.includes("users.email")) {
              return res.status(409).json({ error: "Email already exists" })
            }
          }
          return res.status(500).json({ error: err.message })
        }
        res.json({
          id: this.lastID,
          username,
          email
        })
      }
    )

  } catch (error) { //catch any errors 
    return res.status(500).json({ error: "Server error" })
  }
})
//delete employee - manager accesss
app.delete("/api/employees/:id", authenticate, requireManager, (req, res) => {
  db.run(
    "DELETE FROM users WHERE id = ? AND role = 'employee'", //deletes the user from sql db
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ deleted: this.changes }) //shows how many were deleted
    }
  )
})
//gets shift of week
app.get('/api/shifts', (req, res) => {
  const weekStart = req.query.week; //2025-11-16
  //gets the shift data from sql db
  const sql = `
    SELECT s.id, s.date, s.start_time, s.end_time, s.employee_id, u.username as employee_name
    FROM shifts s
    LEFT JOIN users u ON s.employee_id = u.id
    WHERE s.date >= ? AND s.date < date(?, '+7 days')
  `;
  db.all(sql, [weekStart, weekStart], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows);
  })
})
//create shift
app.post('/api/shifts', async (req, res) => {
  try {
    const { date, start_time, end_time, employee_id } = req.body;
    //if its not the correct employee id then issue
    if (!employee_id) return res.status(400).json({ error: 'Missing employee_id' });
    if (!date || !start_time || !end_time)  //if its missing a date or time issue
      return res.status(400).json({ error: 'Missing date or time' });
    //if everything good then all info about date starttime endtime id is inserted into shifts sql db
    const id = await runAsync(
      'INSERT INTO shifts (date, start_time, end_time, employee_id) VALUES (?, ?, ?, ?)',
      [date, start_time, end_time, employee_id]
    )
    //if its sucessful then cool
    res.json({ success: true, id });
  } catch (err) { //if its not then say it failed to save the shift
    console.error(err);
    res.status(500).json({ error: 'Failed to save shift' })
  }
})
//starts the server 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})

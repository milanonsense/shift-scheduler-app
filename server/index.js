const dayjs = require("dayjs")
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")
const bcrypt = require("bcryptjs")
const session = require("express-session")
const SQLiteStore = require("connect-sqlite3")(session)

const app = express()
app.use( 
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true") 
  res.header("Access-Control-Allow-Origin", "http://localhost:3000") 
  res.header("Access-Control-Allow-Headers", "Content-Type") 
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS") 
  next() 
})
const PORT = 5000
app.use(express.json()) 
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite" }), 
    secret: "superdoopersecret", 
    resave: false, 
    saveUninitialized: false, 
    cookie: {
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 2,
    }, //cookie lasts 2 hours then logs you out
  })
)
const db = new sqlite3.Database('./shifts.db', (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to SQLite");
})
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => { 
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
  })
}
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL
  )
`)
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

(async () => {
  const hashed = await bcrypt.hash("password123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, email, password, role)
     VALUES (?, ?, ?, 'manager')`,
    ["manager1", "manager1@example.com", hashed]
  )
})();

function authenticate(req, res, next) { 
  if (!req.session.user) { 
    return res.status(401).json({ error: "Unauthorized" })
  }
  req.user = req.session.user 
  next()
}
function requireManager(req, res, next) {
  if (req.user.role !== "manager") { 
    return res.status(403).json({ error: "Sorry Managers Only" })
  }
  next()
}
app.post("/api/login", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) 
    return res.status(400).json({ error: "Username and password required" })
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!user) return res.status(401).json({ error: "Invalid credentials- wrong username" }) 
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials- wrong password" })
    req.session.user = {
      id: user.id, 
      username: user.username, 
      role: user.role, 
    }
    res.json({ username: user.username, role: user.role }) 
  })
})

app.post("/api/register", async (req, res) => {
  const { username, email, password, role } = req.body
  if (!username || !email || !password || !role) 
    return res.status(400).json({ error: "All fields required" })
  if (!["manager", "employee"].includes(role)) 
    return res.status(400).json({ error: "Invalid role" })
  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [username, email],
    async (err, existing) => {
      if (err) return res.status(500).json({ error: err.message })
      if (existing) 
        return res.status(409).json({ error: "Username or email already exists" })

      const hashedPassword = await bcrypt.hash(password, 10) 
      db.run(
        `INSERT INTO users (username, email, password, role)
         VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, role],
        function (err) {
          if (err) return res.status(500).json({ error: err.message })
          req.session.user = {
            id: this.lastID,
            username,
            role,
          }

          res.json({ message: "Registered", username, role }) 
        }
      )
    }
  )
})
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }))
})
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" }) 
  res.json(req.session.user)
})
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
app.post("/api/employees", authenticate, requireManager, async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) { 
    return res.status(400).json({ error: "Username, email and password required" })
  }
  try {
    const hashed = await bcrypt.hash(password, 10)
    db.run(
      `
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, 'employee')
      `,
      [username, email, hashed],
      function (err) {
        if (err) { 
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

  } catch (error) { 
    return res.status(500).json({ error: "Server error" })
  }
})
app.delete("/api/employees/:id", authenticate, requireManager, (req, res) => {
  db.run(
    "DELETE FROM users WHERE id = ? AND role = 'employee'", 
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ deleted: this.changes }) 
    }
  )
})
app.get('/api/shifts', (req, res) => {
  const weekStart = req.query.week
  const sql = `
    SELECT s.id, s.date, s.start_time, s.end_time, s.employee_id, u.username as employee_name
    FROM shifts s
    LEFT JOIN users u ON s.employee_id = u.id
    WHERE s.date >= ? AND s.date < date(?, '+7 days')
  `;
  db.all(sql, [weekStart, weekStart], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})
app.get("/api/shifts/week", (req, res) => {
  const { start, end } = req.query 
  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end date" })
  } 
  const sql = `
    SELECT s.id, s.date, s.start_time, s.end_time,
           s.employee_id, u.username AS employee_name
    FROM shifts s
    LEFT JOIN users u ON s.employee_id = u.id     
    WHERE s.date >= ? AND s.date <= ?
    ORDER BY s.date, s.start_time
  `
  db.all(sql, [start, end], (err, rows) => { 
    if (err) return res.status(500).json({ error: err.message }) 
    res.json(rows) 
  })
})

app.post('/api/shifts', async (req, res) => {
  try {
    const { date, start_time, end_time, employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'Missing employee_id' })
    if (!date || !start_time || !end_time)  
      return res.status(400).json({ error: 'Missing date or time' })
    const id = await runAsync(
      'INSERT INTO shifts (date, start_time, end_time, employee_id) VALUES (?, ?, ?, ?)',
      [date, start_time, end_time, employee_id]
    )
    res.json({ success: true, id });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to save shift' })
  }
})
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

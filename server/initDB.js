const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")
const bcrypt = require("bcryptjs")
const bodyParser = require("body-parser")

const app = express()
const PORT = 5000
app.use(cors())
app.use(bodyParser.json())

const db = new sqlite3.Database("./shifts.db", (err) => {
  if (err) console.error("Database connection issue, retry", err.message)
  else console.log("Connected to SQLite database")
})
app.post("/api/login", (req, res) => {
  const { username, password } = req.body
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!user) return res.status(400).json({ error: "User not found" })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(403).json({ error: "Incorrect password" })
    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    })
  })
})
app.post("/api/shifts", (req, res) => {
  const { employee_id, date, start_time, end_time } = req.body;

  db.run(
    `INSERT INTO shifts (employee_id, date, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [employee_id, date, start_time, end_time],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })

      res.json({ success: true, id: this.lastID })
    }
  )
})
app.get("/api/shifts/week", (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end date" })
  }
  db.all(
    `SELECT shifts.*, users.username AS employee_name
     FROM shifts
     JOIN users ON shifts.employee_id = users.id
     WHERE date >= ? AND date <= ?
     ORDER BY date, start_time`,
    [start, end],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows);
    }
  )
})
app.get("/api/users", (req, res) => {
  db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})

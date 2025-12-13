import React, { useState, useEffect } from "react"

function ManageEmployeesPage() {
  const [employees, setEmployees] = useState([]) 
  const [username, setUsername] = useState("") 
  const [email, setEmail] = useState("") 

  useEffect(() => {
    fetchEmployees()
  }, [])
  async function fetchEmployees() {
    const res = await fetch("http://localhost:5000/api/employees", {
      credentials: "include", 
    })
    const data = await res.json() 
    if (res.ok) { 
      setEmployees(data) 
    } else { 
      alert(data.error || "Failed to load employees") 
    }
  }
  async function addEmployee(e) { 
    e.preventDefault() 
    if (!username.trim() || !email.trim()) { 
      return alert("Username and email are required.")
    }
    const defaultPassword = "password123"
    const res = await fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ 
        username,
        email,
        password: defaultPassword,
      }),
    })
    const data = await res.json() 
    if (!res.ok) { 
      alert(data.error)
      return
    }
    setUsername("")
    setEmail("")
    fetchEmployees()
  }
  async function deleteEmployee(id) {
    const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "DELETE",
      credentials: "include", 
    })
    const data = await res.json() 
    if (!res.ok) return alert(data.error || "Could not delete employee") 
    fetchEmployees() 
  }
  return (
  <div className="manage-container">
    <div className="manage-header">
      <h2>Manage Employees</h2>
    </div>
    
    <div className="add-employee-form">
      <form onSubmit={addEmployee}>
        <div className="form-row">
          <input
            type="text"
            className="form-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn-add">Add Employee</button>
        </div>
      </form>
    </div>
    
    <div className="employee-list">
      <ul>
        {employees.map((e) => (
          <li key={e.id} className="employee-item">
            <div className="employee-info">
              {e.username} <span className="email">({e.email})</span>
            </div>
            <button className="btn-delete" onClick={() => deleteEmployee(e.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
}

export default ManageEmployeesPage

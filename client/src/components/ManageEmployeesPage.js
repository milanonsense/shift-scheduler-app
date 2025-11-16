import React, { useState, useEffect } from "react"

function ManageEmployeesPage() {
  const [employees, setEmployees] = useState([]) //list of employees fetched from backend
  const [username, setUsername] = useState("") //username for create new employee
  const [email, setEmail] = useState("") //email when create new employee

  //runs once and calls fetchemployees to load the list of employees
  useEffect(() => {
    fetchEmployees()
  }, [])
  //sends a get request to fetch all employees from the backend
  async function fetchEmployees() {
    const res = await fetch("http://localhost:5000/api/employees", {
      credentials: "include", //cookie-session
    })
    const data = await res.json() //changes it into javascript
    if (res.ok) { //if the request was good then
      setEmployees(data) //store employees
    } else { //if the request was bad
      alert(data.error || "Failed to load employees") //error shows up
    }
  }
  async function addEmployee(e) { 
    e.preventDefault() //stops from refresh

    if (!username.trim() || !email.trim()) { //if user didnt input username or email then its gonna say that message
      return alert("Username and email are required.")
    }
    const defaultPassword = "password123"; //default password
    //post request for new employee creation
    const res = await fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", //sends session cookie which needs to be authenticated
      body: JSON.stringify({ //the data (username, email, default pass) is sent to the backend
        username,
        email,
        password: defaultPassword,
      }),
    })
    const data = await res.json() //cjange to readable javascript

    if (!res.ok) { //if username already exists then error
      alert(data.error)
      return
    }

    //clears everything
    setUsername("")
    setEmail("")

    //refreshes with employees after add new employee
    fetchEmployees();
  }

  //deleting an employee by their id - delete request
  async function deleteEmployee(id) {
    const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "DELETE",
      credentials: "include", //cookie-session
    })

    const data = await res.json() //change to jaavscript
    if (!res.ok) return alert(data.error || "Could not delete employee") //if failed show this message

    fetchEmployees() //refreshes with employees after delete
  }

  return (
    <div>
      <h2>Manage Employees</h2>
      <form onSubmit={addEmployee} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button type="submit">Add Employee</button>
      </form>
      <ul>
        {employees.map((e) => (
          <li key={e.id}>
            {e.username} ({e.email})
            <button
              onClick={() => deleteEmployee(e.id)}
              style={{ marginLeft: "1rem" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageEmployeesPage;

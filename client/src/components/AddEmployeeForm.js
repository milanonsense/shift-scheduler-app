import React, { useState, useEffect } from "react";

function AddEmployeeForm() {
  const [name, setName] = useState("");
  const [employees, setEmployees] = useState([]);

  // Loads employees
  useEffect(() => {
    fetchEmployees();
  }, []);
 //fetches employee data
  async function fetchEmployees() {
    const res = await fetch("http://localhost:5000/api/employees");
    const data = await res.json();
    setEmployees(data);
  }
  //handles submission for forms adding new employees and sends employee name to backend API
  async function addEmployee(e) {
    e.preventDefault();
    if (!name.trim()) return;

    await fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    fetchEmployees();
  }
  //deletes employee calling backend API
  async function deleteEmployee(id) {
    await fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" });
    fetchEmployees();
  }
  //All UI for website 
  return (
    <div>
      <h2>Employee Manager</h2>

      <form onSubmit={addEmployee}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Employee name"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {employees.map((e) => (
          <li key={e.id}>
            {e.name}{" "}
            <button onClick={() => deleteEmployee(e.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddEmployeeForm;

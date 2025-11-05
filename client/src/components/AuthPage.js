import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee"); // default to employee
  const { setUser } = useAuth();
  const navigate = useNavigate(); // redirect

  const handleLogin = () => {
    if (!name) return alert("Please enter your name"); //user enters name no password yet

    // Set user in context
    setUser({ name, role });

    // Redirect based on role
    if (role === "manager") {
      navigate("/");      // go to scheduler or employee management
    } else {
      navigate("/view");  // go to view schedule
    }
  };
//ui for login
  return (
    <div style={{ padding: "20px" }}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginRight: "10px" }}>
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
      </select>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

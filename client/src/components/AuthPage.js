import React, { useState } from "react"
import { useAuth } from "./AuthContext"
import { useNavigate } from "react-router-dom"

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("employee")
  const { setUser } = useAuth() 
  const navigate = useNavigate() 
  
  const handleLogin = async () => {
    if (!username || !password) { 
      return alert("Please enter username and password")
    }
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) return alert(data.error || "Login failed") 
      setUser({ username: data.username, role: data.role }) 
      navigate(data.role === "manager" ? "/" : "/view") 
    } catch (error) {
      console.error("Login error", error) 
      alert("Issue during login")
    }
  }
  
  const handleRegister = async () => {
    if (!username || !email || !password || !role) {
      return alert("All fields are required") 
    }
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ username, email, password, role }), 
      })
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Registration failed")
      setUser({ username: data.username, role: data.role })
      navigate(data.role === "manager" ? "/" : "/view")
    } catch (error) {
      console.error("Registration error", error) 
      alert("Error during registration")
    }
  }
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="app-logo">FE Scheduler</div>
        <h2>{isRegistering ? "Register" : "Login"}</h2>
        <p className="auth-subtitle">
          {isRegistering ? "Create your account" : "Welcome back"}
        </p>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {isRegistering && (
          <>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? "Create Account" : "Login"}
        </button>

        <div className="auth-toggle">
          <button className="btn-link" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Already have an account? Login" : "New user? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
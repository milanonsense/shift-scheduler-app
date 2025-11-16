import React, { useState } from "react"
import { useAuth } from "./AuthContext"
import { useNavigate } from "react-router-dom"

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  //shared for login and registration
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  //for registration specifically
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("employee")
  
  const { setUser } = useAuth() //user in context after login or registration
  const navigate = useNavigate() //helps w navigation
  //handles the login
  const handleLogin = async () => {
    if (!username || !password) { //if nothing is inputted enter a username and password
      return alert("Please enter username and password")
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", //session cookie request
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) return alert(data.error || "Login failed") //if request is not okay login is failed

      setUser({ username: data.username, role: data.role }) //stores user details
      navigate(data.role === "manager" ? "/" : "/view") //different pages based on role
    } catch (error) {
      console.error("Login error", error) //if an error occurs the user is shown 
      alert("Issue during login")
    }
  };
  //for register 
  const handleRegister = async () => {
    if (!username || !email || !password || !role) {
      return alert("All fields are required") //if all of the fields are empty this error shows
    }
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", //cookie request again because its for authentication 
        body: JSON.stringify({ username, email, password, role }), //what they are awaiting
      })
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Registration failed"); //if its not okay then it shows the error that registration has failed 
      //automatically logs in after registration 
      setUser({ username: data.username, role: data.role }); //store user details inputted from registration
      navigate(data.role === "manager" ? "/" : "/view"); //if manager or employee it redirects based on the account user created
    } catch (error) {
      console.error("Registration error", error) //if theres any errors a error shows up 
      alert("Error during registration")
    }
  }
  return (
    <div style={{ padding: "20px" }}>
      <h2>{isRegistering ? "Register" : "Login"}</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginRight: "10px", display: "block", marginBottom: "10px" }}
      />

      {isRegistering && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginRight: "10px", display: "block", marginBottom: "10px" }}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ marginRight: "10px", display: "block", marginBottom: "10px" }}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </>
      )}

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginRight: "10px", display: "block", marginBottom: "10px" }}
      />

      {isRegistering ? (
        <button onClick={handleRegister}>Create Account</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}

      <div style={{ marginTop: "15px" }}>
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account? Login" : "New user? Register"}
        </button>
      </div>
    </div>
  );
}

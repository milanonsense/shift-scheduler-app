import React from "react"
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom"
import ScheduleTable from "./components/ScheduleTable"
import ManageEmployeesPage from "./components/ManageEmployeesPage"
import AuthPage from "./components/AuthPage"
import ViewSchedule from "./components/ViewSchedule"
import { useAuth } from "./components/AuthContext"
import './styles.css'
import "bootstrap/dist/css/bootstrap.min.css"

function ManagerRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />  
  if (user.role !== "manager") return <Navigate to="/view" /> 
  return children    
}

function AnyUserRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return children
}

// Create a new component that uses useLocation
function AppContent() {
  const { user, setUser } = useAuth()
  const location = useLocation()
  
  const handleLogout = () => {
    setUser(null)
  }
  
  const showNav = user && location.pathname !== '/login'
  
  return (
    <>
      {showNav && (
        <nav className="nav-container">
          <div className="nav-wrapper">
            <div className="nav-links">
              <Link to="/" className="nav-link">Schedule</Link>
              <Link to="/view" className="nav-link">View Schedule</Link>
              <Link to="/manage" className="nav-link">Manage Employees</Link>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>
      )}
      
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<ManagerRoute><ScheduleTable /></ManagerRoute>} />
        <Route path="/manage" element={<ManagerRoute><ManageEmployeesPage /></ManagerRoute>} />
        <Route path="/view" element={<AnyUserRoute><ViewSchedule /></AnyUserRoute>} />
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? user.role === "manager"
                    ? "/"
                    : "/view"
                  : "/login"
              }
            />
          }
        />
      </Routes>
    </>
  )
}

export default function App() {   
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
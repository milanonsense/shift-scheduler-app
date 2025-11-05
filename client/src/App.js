import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import ScheduleTable from "./components/ScheduleTable";
import AddEmployeeForm from "./components/AddEmployeeForm";
import AuthPage from "./components/AuthPage";
import ViewSchedule from "./components/ViewSchedule";
import { useAuth } from "./components/AuthContext";

// Routes guides
function ManagerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "manager") return <Navigate to="/view" />;
  return children;
}

function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "employee") return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      {/* Navbar */}
      <nav style={{ marginBottom: 20 }}>
        {user?.role === "manager" && (
          <>
            <Link to="/">Scheduler</Link> | <Link to="/employees">Manage Employees</Link>
          </>
        )}
        {user?.role === "employee" && (
          <Link to="/view">View Schedule</Link>
        )}
        {" | "}
        {user ? (
          <button onClick={handleLogout} style={{ marginLeft: 10 }}>Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        {/* Manager pages */}
        <Route path="/" element={<ManagerRoute><ScheduleTable /></ManagerRoute>} />
        <Route path="/employees" element={<ManagerRoute><AddEmployeeForm /></ManagerRoute>} />

        {/* Employee pages */}
        <Route path="/view" element={<EmployeeRoute><ViewSchedule /></EmployeeRoute>} />

        {/* Fallback route */}
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
    </Router>
  );
}

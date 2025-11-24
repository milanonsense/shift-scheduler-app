import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import ScheduleTable from "./components/ScheduleTable";
import ManageEmployeesPage from "./components/ManageEmployeesPage";
import AuthPage from "./components/AuthPage";
import ViewSchedule from "./components/ViewSchedule";
import { useAuth } from "./components/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";


function ManagerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;   //if it is not a user is not logged in then sends them back to login page
  if (user.role !== "manager") return <Navigate to="/view" />; //checks if user is manager
  return children;    //if passes person is logged in as a manager then it returns them to the manager only view 
}
//commented this out because i wanted anyone to see the view schedule page and not just employees so if i keep this in it'll be a error message but i need it for laterr
/*
function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;  //if it is not a user is not logged in then sends them back to login page
  if (user.role !== "employee") return <Navigate to="/" />; //checks if user is employee if not redirects to start up page
  return children;    //if passes person is logged in as employee then it returns them to the employee only view
}
*/
function AnyUserRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return children; // any logged-in user can access
}
export default function App() {   //logout system obvi
  const { user, setUser } = useAuth()

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <Router>
      {/* Navbar */}
      <nav style={{ marginBottom: 20 }}>
        {user?.role === "manager" && (    //if it is a manager then they see manage employees and scheduler 
          <>
            <Link to="/">Scheduler</Link> | <Link to="/employees">Manage Employees</Link>   
          </>
        )} 
        {" | "}
        {user && <Link to="/view">View Schedule</Link>}
        {" | "}
        {user ? (
          <button onClick={handleLogout} style={{ marginLeft: 10 }}>Logout</button>   //when someone clicks the logout they get sent to the login page
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        {/* Manager Only */}
        <Route path="/" element={<ManagerRoute><ScheduleTable /></ManagerRoute>} />
        <Route path="/employees" element={<ManagerRoute><ManageEmployeesPage /></ManagerRoute>} />

        {/* all of the pages*/}
        <Route path="/view" element={<AnyUserRoute><ViewSchedule /></AnyUserRoute>} />

        {/* if any issues go back to this */}
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

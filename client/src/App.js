import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Index from "./components/ScheduleTable"; // your scheduler page
import AddEmployeeForm from "./components/AddEmployeeForm";

function App() {
  return (
    <Router>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/">Scheduler</Link> |{" "}
        <Link to="/employees">Manage Employees</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/employees" element={<AddEmployeeForm />} />
      </Routes>
    </Router>
  );
}

export default App;
//added routes
//installed react-router-dom
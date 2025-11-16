import React, { useState, useEffect } from "react"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek" //dayjs uses sunday this is to make it use monday 
import { useAuth } from './AuthContext'
dayjs.extend(isoWeek) //extend it so that it can do the monday weeks 

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] //array with dow (days of week)
//array of shift times
const SHIFTS = [
  ["7:00", "3:00"],
  ["8:00", "3:00"],
  ["9:30", "3:00"],
  ["11:00", "4:00"],
  ["3:00", "7:00"],
  ["3:00", "8:00"],
  ["3:00", "9:00"],
  ["4:00", "9:00"],
]
//displaying of the schedule
export default function ViewSchedule() {
  const [schedule, setSchedule] = useState({})  //store loaded schedule
  const [currentWeek, setCurrentWeek] = useState(dayjs()) //stores current week
  const { user } = useAuth() //authentication to get logged in user

  // Fetch shifts for the week
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/shifts/week?week=${currentWeek.format("YYYY-MM-DD")}`) //send current week as date string
        const data = await res.json() //make the response into json
        const shiftsArray = Array.isArray(data) ? data : [] //checks if the response is a array
        const loaded = {} //new object to store the shifts in the correct format
        shiftsArray.forEach(shift => {
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}` //unique for each shift
          loaded[key] = shift.employee_name //make sure shift is assigned with employee name
        });
        setSchedule(loaded) //update with loaded shifts
      } catch (err) {
        console.error("Failed to generate shifts", err) //error if api fails
      }
    };
    //fetches the shifts and changes when the current week changes
    fetchShifts()
  }, [currentWeek])

  // gets date for specific day in the week
  const getDateForDay = (index) => {
    return currentWeek.startOf("isoWeek").add(index, "day").format("YYYY-MM-DD") //start from first day of week to end 
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Shift Scheduler</h2>

      <div style={{ fontSize: "18px", marginBottom: "15px", fontWeight: "bold" }}>
        Welcome, {user?.username} — <span style={{ color: "gray" }}>{user?.role}</span>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}>← Previous Week</button>
        <strong style={{ margin: "0 1rem" }}>Week of {currentWeek.startOf("isoWeek").format("YYYY-MM-DD")}</strong>
        <button onClick={() => setCurrentWeek(currentWeek.add(1, "week"))}>Next Week →</button>
      </div>

      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>Shift</th>
            {DAYS.map((day, i) => (
              <th key={i}>{day}<br />{getDateForDay(i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map((shift, shiftIndex) => (
            <tr key={shiftIndex}>
              <td>{shift[0]} - {shift[1]}</td>
              {DAYS.map((_, dayIndex) => {
                const date = getDateForDay(dayIndex);
                const key = `${date}_${shift[0]}-${shift[1]}`;
                return (
                  <td key={dayIndex}>{schedule[key] || "-"}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = [
  ["7:00", "3:00"],
  ["8:00", "3:00"],
  ["9:30", "3:00"],
  ["11:00", "4:00"],
  ["3:00", "7:00"],
  ["3:00", "8:00"],
  ["3:00", "9:00"],
  ["4:00", "9:00"],
];

export default function ViewSchedule() {
  const [schedule, setSchedule] = useState({});
  const [currentWeek, setCurrentWeek] = useState(dayjs());

  // Fetch shifts for the week
  useEffect(() => {
    fetch(`http://localhost:5000/api/shifts/week?week=${currentWeek.format("YYYY-MM-DD")}`)
      .then(res => res.json())
      .then(data => {
        const loaded = {};
        data.forEach(shift => {
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}`;
          loaded[key] = shift.employee_name;
        });
        setSchedule(loaded);
      });
  }, [currentWeek]);

  const getDateForDay = (index) => {
    return currentWeek.startOf("week").add(1 + index, "day").format("YYYY-MM-DD");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>View Schedule</h2>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}>← Previous Week</button>
        <strong style={{ margin: "0 1rem" }}>Week of {currentWeek.format("YYYY-MM-DD")}</strong>
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

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAuth } from './AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = [
  ['7:00', '3:00'],
  ['8:00', '3:00'],
  ['9:30', '3:00'],
  ['11:00', '4:00'],
  ['3:00', '7:00'],
  ['3:00', '8:00'],
  ['3:00', '9:00'],
  ['4:00', '9:00'],
];

export default function ScheduleTable() {
  const [employees, setEmployees] = useState([]) //stores employee list
  const [schedule, setSchedule] = useState({}) //store schedule
  const [currentWeek, setCurrentWeek] = useState(dayjs()) //store currentweek
  const { user } = useAuth() //get user info
  const isManager = user?.role === 'manager' //is logged in user a manger or not
//fetches the employees once
  useEffect(() => {
  fetch('http://localhost:5000/api/employees', {
    credentials: "include" //sends a cookie request for sessions
  })
    .then(res => res.json()) //make it into a json
    .then(data => setEmployees(data)); //sets the data from employee into a state
  }, []); //added empty array so it runs only once

//fetches shift for the week and stores them
  useEffect(() => {
    fetch(`http://localhost:5000/api/shifts?week=${currentWeek.format('YYYY-MM-DD')}`)
      .then(res => res.json()) //make into json
      .then(data => {
        const loaded = {} //temp object holds loaded schedule
        data.forEach(shift => { //each shift in data that was fetched it creates a key and assignes employee name
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}` //key
          loaded[key] = shift.employee_name //assigning employee name
        })
        setSchedule(loaded) //final schedule
      })
  }, [currentWeek]) //when week changes it runs

  const getDateForDay = (index, weekStart = currentWeek) =>
    weekStart.startOf('week').add(1 + index, 'day').format('YYYY-MM-DD') //goes from monday to add the day and make it in the correct format

  const handleSelect = (dayIndex, shift, employeeId) => { //selects shift for employee -MANAGERS ONLY
    if (!isManager) return //if its not a manager stop
    const date = getDateForDay(dayIndex) //if it is then gets the dates for the day selected
    const key = `${date}_${shift[0]}-${shift[1]}` //key for shift
    setSchedule(prev => ({ ...prev, [key]: employeeId })) //schedule update with the key and the selcted employee
  }

  const handleSave = async () => {
    if (!isManager) return alert('Only managers can modify schedules.') //if someone who is not a manager tries to modify the scheudle alert is sent 

    const conflicts = {};
    for (const key in schedule) {
      const [date] = key.split('_')
      const employee = schedule[key]
      if (!conflicts[date]) conflicts[date] = {}
      if (conflicts[date][employee]) {
        alert(`Error: ${employee} is scheduled more than once on ${date}`)  //if the same employee is scheduled on the same day (they cant do that so error is shown)
        return;
      }
      conflicts[date][employee] = true;
    }

    const payloads = Object.entries(schedule).map(([key, employee_id]) => { 
        const [date, timeRange] = key.split('_') //make the key split so its seperate
        const [start_time, end_time] = timeRange.split('-') //time split
        return { date, start_time, end_time, employee_id } //return new object each time
      })


    for (const payload of payloads) {
      await fetch('http://localhost:5000/api/shifts', {   //posts the completed schedule
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    alert('Schedule saved'); //save the schedule
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Shift Scheduler</h2>

      <div style={{ 
        fontSize: "18px", 
        marginBottom: "15px", 
        fontWeight: "bold" 
      }}>
        Welcome, {user?.username} — <span style={{ color: "gray" }}>{user?.role}</span>
      </div>


      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setCurrentWeek(currentWeek.subtract(1, 'week'))}>
          ← Previous Week
        </button>
        <strong style={{ margin: '0 1rem' }}>
          Week of {currentWeek.format('YYYY-MM-DD')}
        </strong>
        <button onClick={() => setCurrentWeek(currentWeek.add(1, 'week'))}>
          Next Week →
        </button>
      </div>

      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>Shift</th>
            {DAYS.map((day, i) => (
              <th key={i}>
                {day}
                <br />
                {getDateForDay(i)}
              </th>
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
                const assigned = schedule[key] || '';
                
                return (
                  <td key={dayIndex}>
                    <select
                      value={assigned || ''}
                      onChange={e => handleSelect(dayIndex, shift, e.target.value)}
                      disabled={!isManager}
                    >
                      <option value="">Select</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {isManager && (
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSave}> Save Schedule</button>
        </div>
      )}
    </div>
  );
}

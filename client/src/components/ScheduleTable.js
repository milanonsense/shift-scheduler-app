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
  const [employees, setEmployees] = useState([])
  const [schedule, setSchedule] = useState({})
  const [currentWeek, setCurrentWeek] = useState(dayjs())
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  useEffect(() => {
    fetch('http://localhost:5000/api/employees', {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error('Error fetching employees:', err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5000/api/shifts?week=${currentWeek.format('YYYY-MM-DD')}`)
      .then(res => res.json())
      .then(data => {
        const loaded = {}
        data.forEach(shift => {
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}`
          // Store as string to match select value
          loaded[key] = String(shift.employee_id)
        })
        setSchedule(loaded)
      })
      .catch(err => console.error('Error fetching shifts:', err));
  }, [currentWeek])

  const getDateForDay = (index, weekStart = currentWeek) =>
    weekStart.startOf('week').add(1 + index, 'day').format('YYYY-MM-DD')

  const handleSelect = (dayIndex, shift, employeeId) => {
    if (!isManager) return
    const date = getDateForDay(dayIndex)
    const key = `${date}_${shift[0]}-${shift[1]}`
    setSchedule(prev => ({ ...prev, [key]: employeeId }))
  }

  const handleSave = async () => {
    if (!isManager) return alert('Only managers can modify schedules.')

    const conflicts = {};
    for (const key in schedule) {
      const [date] = key.split('_')
      const employee = schedule[key]
      if (!conflicts[date]) conflicts[date] = {}
      if (conflicts[date][employee]) {
        alert(`Error: Employee is scheduled more than once on ${date}`)
        return;
      }
      conflicts[date][employee] = true;
    }

    const payloads = Object.entries(schedule)
      .filter(([_, employee_id]) => employee_id && employee_id !== '')
      .map(([key, employee_id]) => {
        const [date, timeRange] = key.split('_')
        const [start_time, end_time] = timeRange.split('-')
        return { date, start_time, end_time, employee_id }
      })

    for (const payload of payloads) {
      await fetch('http://localhost:5000/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    alert('Schedule saved');
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>Shift Scheduler</h2>
        <div className="user-info">
          Welcome, {user?.username} — <span className="role-badge">{user?.role}</span>
        </div>
      </div>

      <div className="week-controls">
        <button className="btn-secondary" onClick={() => setCurrentWeek(currentWeek.subtract(1, 'week'))}>
          ← Previous Week
        </button>
        <div className="week-label">
          Week of {currentWeek.format('YYYY-MM-DD')}
        </div>
        <button className="btn-secondary" onClick={() => setCurrentWeek(currentWeek.add(1, 'week'))}>
          Next Week →
        </button>
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Shift</th>
              {DAYS.map((day, i) => (
                <th key={i}>
                  {day}
                  <br />
                  <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>
                    {getDateForDay(i)}
                  </span>
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
                        className="shift-select"
                        value={assigned}
                        onChange={e => handleSelect(dayIndex, shift, e.target.value)}
                        disabled={!isManager}
                      >
                        <option value="">Select</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={String(emp.id)}>{emp.username}</option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isManager && (
        <div className="save-button-container">
          <button className="btn-save" onClick={handleSave}>Save Schedule</button>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

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

//The Main Part
export default function ScheduleTable() {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [currentWeek, setCurrentWeek] = useState(dayjs());

  //Employee fetch only once
  useEffect(() => {
    fetch('http://localhost:5000/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, []);

  //when week changes shifts fetched 
  useEffect(() => {
    fetch(`http://localhost:5000/api/shifts?week=${currentWeek.format('YYYY-MM-DD')}`)
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

  //date string (YYYY-MM-DD) (0 = Mon, 6 = Sun)
  const getDateForDay = (index, weekStart = currentWeek) => {
    return weekStart.startOf('week').add(1 + index, 'day').format('YYYY-MM-DD');
  };

  //dropdown
  const handleSelect = (dayIndex, shift, employeeName) => {
    const date = getDateForDay(dayIndex);
    const key = `${date}_${shift[0]}-${shift[1]}`;
    setSchedule(prev => ({ ...prev, [key]: employeeName }));
  };

  //save button
  const handleSave = async () => {
    //Checks if employees assigned more than once per day
    const conflicts = {};

    for (const key in schedule) {
      const [date] = key.split('_');
      const employee = schedule[key];

      if (!conflicts[date]) conflicts[date] = {};
      if (conflicts[date][employee]) {
        alert(`⚠️ Conflict: ${employee} is scheduled more than once on ${date}`);
        return;
      }
      conflicts[date][employee] = true;
    }

    //If no conflicts with check, shifts will be saved
    const payloads = Object.entries(schedule).map(([key, employee_name]) => {
      const [date, timeRange] = key.split('_');
      const [start_time, end_time] = timeRange.split('-');
      return { date, start_time, end_time, employee_name };
    });

    for (const payload of payloads) {
      await fetch('http://localhost:5000/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    alert('✅ Schedule saved!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Shift Scheduler</h2>

      {/* Week Navigation */}
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

      {/* Schedule Table */}
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
                  <td key={dayIndex}>
                    <select
                      value={schedule[key] || ''}
                      onChange={e => handleSelect(dayIndex, shift, e.target.value)}
                    >
                      <option value="">Select</option>
                      {employees.map(emp => (
                        <option key={emp.name} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Save Button */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleSave}>💾 Save Schedule</button>
      </div>
    </div>
  );
}

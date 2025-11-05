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
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetch('http://localhost:5000/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, []);

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

  const getDateForDay = (index, weekStart = currentWeek) =>
    weekStart.startOf('week').add(1 + index, 'day').format('YYYY-MM-DD');

  const handleSelect = (dayIndex, shift, employeeName) => {
    if (!isManager) return;
    const date = getDateForDay(dayIndex);
    const key = `${date}_${shift[0]}-${shift[1]}`;
    setSchedule(prev => ({ ...prev, [key]: employeeName }));
  };

  const handleSave = async () => {
    if (!isManager) return alert('Only managers can modify schedules.');

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
      <p>Welcome, {user?.username || 'Guest'} ({user?.role || 'unknown role'})</p>

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
                      value={assigned}
                      onChange={e => handleSelect(dayIndex, shift, e.target.value)}
                      disabled={!isManager}
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

      {isManager && (
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSave}>💾 Save Schedule</button>
        </div>
      )}
    </div>
  );
}

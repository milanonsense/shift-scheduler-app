const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./shifts.db');
const dayjs = require('dayjs');

//Defines employees
const EMPLOYEES = Array.from({ length: 31 }, (_, i) => `Employee ${i + 1}`);


//shift times
const SHIFT_TIMES = [
   ['7:00', '3:00'],
  ['8:00', '3:00'],
  ['9:30', '3:00'],
  ['11:00', '4:00'],
  ['3:00', '7:00'],
  ['3:00', '8:00'],
   ['3:00', '9:00'],
  ['4:00', '9:00'],
];

//date range
const today = dayjs();
const START_DATE = today.startOf('week').add(1, 'day'); // Start from Monday
const DAYS = 7;

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function seedShifts() {
  db.serialize(() => {
    //Clears old data if necessary
    db.run('DELETE FROM shifts');

    for (let i = 0; i < DAYS; i++) {
      const date = START_DATE.add(i, 'day').format('YYYY-MM-DD');

      const usedEmployees = new Set();

      for (let j = 0; j < 8; j++) {
        let employee;
        do {
          employee = getRandomItem(EMPLOYEES);
        } while (usedEmployees.has(employee));
        usedEmployees.add(employee);

        const [start, end] = getRandomItem(SHIFT_TIMES);

        db.run(
          `INSERT INTO shifts (employee_name, date, start_time, end_time) VALUES (?, ?, ?, ?)`,
          [employee, date, start, end],
          (err) => {
            if (err) console.error(err.message);
          }
        );
      }
    }
    console.log('✔️ Seeded database with random shifts.');
  });

  db.close();
}

seedShifts();

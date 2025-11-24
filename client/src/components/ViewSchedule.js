import React, { useState, useEffect } from "react"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useAuth } from "./AuthContext"
import { Container, Card, Table, Button, Row, Col, Badge } from "react-bootstrap" //using bootstrap framework for api for schedule

dayjs.extend(isoWeek) //allows for monday - sunday shifts which i have and would ruin things if i didnt add this

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

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
export default function ViewSchedule() { 
  const [schedule, setSchedule] = useState({})
  const [currentWeek, setCurrentWeek] = useState(dayjs()) //tracks the week the user is currently looking at but defaults to the current week with dayjs
  const { user } = useAuth()
  useEffect(() => { //when the week changes reload schedule
    const fetchShifts = async () => {
      try {
        const weekStart = currentWeek.startOf("isoWeek").format("YYYY-MM-DD") //start
        const weekEnd = currentWeek.endOf("isoWeek").format("YYYY-MM-DD") //end
      //fetch for shift data from backend
        const res = await fetch(
          `http://localhost:5000/api/shifts/week?start=${weekStart}&end=${weekEnd}`
        )
        const data = await res.json()
        const shiftsArray = Array.isArray(data) ? data : [] //make the data into a array
        const loaded = {} 
        shiftsArray.forEach((shift) => {
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}` //the key helps with identification and pulling so shift date and shift start and end is what i need
          loaded[key] = shift.employee_name //attaches it to workers name
        })
        setSchedule(loaded) //sets the schedule with all that information
      } catch (err) {
        console.error("Failed to load shifts", err) //if theres an error then show its an error
      }
    }

    fetchShifts() //this is a rerun to get next week and the week befores schedule
  }, [currentWeek])
  const getDateForDay = (index) => { //helps with actial dates for the week go day by day
    return currentWeek.startOf("isoWeek").add(index, "day").format("YYYY-MM-DD")
  }

  return (
    <Container className="mt-4">
      {/* Header using card*/}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h2 className="fw-bold">Weekly Shift Schedule</h2>
          <p className="text-muted mb-1">
            Welcome, <strong>{user?.username}</strong> — <Badge bg="secondary">{user?.role}</Badge>
          </p>
        </Card.Body>
      </Card>

      {/* Week Controls week before n week after buttons*/}
      <Row className="align-items-center mb-3">
        <Col xs="auto">
          <Button
            variant="outline-primary"
            onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}
          >
            ← Previous Week
          </Button>
        </Col>

        <Col className="text-center fw-bold">
          <span style={{ fontSize: "1.2rem" }}>
            Week of {currentWeek.startOf("isoWeek").format("YYYY-MM-DD")}
          </span>
        </Col>

        <Col xs="auto">
          <Button
            variant="outline-primary"
            onClick={() => setCurrentWeek(currentWeek.add(1, "week"))}
          >
            Next Week →
          </Button>
        </Col>
      </Row>

      {/*Main schedule*/}
      <Card className="shadow-sm">
        <Card.Body>
          <Table bordered striped hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Shift</th>
                {/* Header for each day of the week */}
                {DAYS.map((day, i) => (
                  <th key={i} className="text-center">
                    {day}
                    <br />
                    <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                      {getDateForDay(i)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SHIFTS.map((shift, shiftIndex) => (
                <tr key={shiftIndex}>
                  <td className="fw-semibold">
                    {shift[0]} - {shift[1]}
                  </td>

                  {DAYS.map((_, dayIndex) => {
                    const date = getDateForDay(dayIndex);
                    const key = `${date}_${shift[0]}-${shift[1]}`;

                    return (
                      <td key={dayIndex} className="text-center">
                        {schedule[key] || (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

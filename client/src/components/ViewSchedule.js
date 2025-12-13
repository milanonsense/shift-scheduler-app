import React, { useState, useEffect } from "react"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useAuth } from "./AuthContext"
import { Container, Card, Table, Button, Row, Col, Badge } from "react-bootstrap" 
dayjs.extend(isoWeek) 
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
  const [currentWeek, setCurrentWeek] = useState(dayjs()) 
  const { user } = useAuth()
  useEffect(() => { 
    const fetchShifts = async () => {
      try {
        const weekStart = currentWeek.startOf("isoWeek").format("YYYY-MM-DD")
        const weekEnd = currentWeek.endOf("isoWeek").format("YYYY-MM-DD") 
        const res = await fetch(
          `http://localhost:5000/api/shifts/week?start=${weekStart}&end=${weekEnd}`
        )
        const data = await res.json()
        const shiftsArray = Array.isArray(data) ? data : [] 
        const loaded = {} 
        shiftsArray.forEach((shift) => {
          const key = `${shift.date}_${shift.start_time}-${shift.end_time}` 
          loaded[key] = shift.employee_name 
        })
        setSchedule(loaded) 
      } catch (err) {
        console.error("Failed to load shifts", err) 
      }
    }
    fetchShifts() 
  }, [currentWeek])
  const getDateForDay = (index) => { 
    return currentWeek.startOf("isoWeek").add(index, "day").format("YYYY-MM-DD")
  }

  return (
    <Container className="mt-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h2 className="fw-bold">Weekly Shift Schedule</h2>
          <p className="text-muted mb-1">
            Welcome, <strong>{user?.username}</strong> — <Badge bg="secondary">{user?.role}</Badge>
          </p>
        </Card.Body>
      </Card>
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
      <Card className="shadow-sm">
        <Card.Body>
          <Table bordered striped hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Shift</th>
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

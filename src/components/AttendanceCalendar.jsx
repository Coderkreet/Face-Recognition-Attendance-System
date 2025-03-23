import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaHome,
  FaClock,
  FaPlus
} from 'react-icons/fa';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [monthStats, setMonthStats] = useState({
    workingDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidays: 0
  });

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    generateCalendarDays(currentDate);
  }, [currentDate]);

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    let workingDays = 0;
    let presentDays = 0;
    let holidays = 0;
    let absentDays = 0;

    // Get attendance records
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ 
        day: null, 
        isCurrentMonth: false 
      });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dayOfWeek = currentDay.getDay();
      const dateString = currentDay.toLocaleDateString();
      
      const isSunday = dayOfWeek === 0;
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const isPastDay = currentDay < new Date().setHours(0, 0, 0, 0);
      
      // Check attendance for this day
      const dayRecord = records.find(record => 
        new Date(record.timestamp).toLocaleDateString() === dateString
      );

      if (!isSunday) {
        workingDays++;
        if (dayRecord) {
          presentDays++;
        } else if (isPastDay) {
          absentDays++;
        }
      }
      if (isSunday) holidays++;

      days.push({
        day,
        isCurrentMonth: true,
        isSunday,
        isToday,
        attendance: dayRecord?.status || (isPastDay && !isSunday ? 'absent' : null),
        timestamp: dayRecord?.timestamp || null
      });
    }

    setCalendarDays(days);
    setMonthStats({
      workingDays,
      presentDays,
      absentDays,
      holidays
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'transparent';
    switch (status.toLowerCase()) {
      case 'present':
      case 'work from office':
        return 'rgba(25, 135, 84, 0.1)';
      case 'work from home':
        return 'rgba(13, 110, 253, 0.1)';
      case 'late arrival':
        return 'rgba(255, 193, 7, 0.1)';
      case 'absent':
        return 'rgba(220, 53, 69, 0.1)';
      default:
        return 'transparent';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'present':
      case 'work from office':
        return <FaCheckCircle className="text-success" />;
      case 'work from home':
        return <FaHome className="text-primary" />;
      case 'late arrival':
        return <FaClock className="text-warning" />;
      case 'absent':
        return <FaTimesCircle className="text-danger" />;
      default:
        return null;
    }
  };

  return (
    <div className="calendar-wrapper">
      <style>
        {`
          .calendar-wrapper {
            display: grid;
            grid-template-columns: 250px 1fr;
            height: calc(100vh - 100px); /* Adjust based on your layout */
            background: rgba(30, 30, 47, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .date-sidebar {
            background: rgba(0, 255, 135, 0.1);
            padding: 1.5rem;
            color: #fff;
            position: relative;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
          }

          .current-date {
            font-size: 3.5rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #00ff87, #60efff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .current-day {
            font-size: 1.2rem;
            font-weight: 500;
            margin-bottom: 1rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .calendar-main {
            padding: 1.5rem;
          }

          .month-navigation {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }

          .year-month {
            font-size: 1.1rem;
            font-weight: 500;
            color: #00ff87;
          }

          .calendar-grid-container {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            padding: 1rem;
          }

          .weekday-header {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem;
            padding: 0.5rem;
            text-align: center;
            font-weight: 500;
          }

          .calendar-day {
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            color: rgba(255, 255, 255, 0.8);
            margin: 2px;
          }

          .calendar-day:hover {
            background: rgba(0, 255, 135, 0.1);
          }

          .calendar-day.active {
            background: rgba(0, 255, 135, 0.2);
            color: #00ff87;
            font-weight: 600;
          }

          .calendar-day.today {
            border: 1px solid #00ff87;
          }

          .calendar-day.sunday {
            color: #ff5e5e;
          }

          .create-event-btn {
            position: absolute;
            bottom: 3rem;
            left: 1.5rem;
            right: 1.5rem;
            padding: 0.8rem;
            background: rgba(0, 255, 135, 0.1);
            border: 1px solid rgba(0, 255, 135, 0.2);
            border-radius: 8px;
            color: #00ff87;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
          }

          .create-event-btn:hover {
            background: rgba(0, 255, 135, 0.2);
          }

          .event-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            transition: all 0.2s ease;
          }

          .event-indicator.present {
            background: #00ff87;
            box-shadow: 0 0 5px rgba(0, 255, 135, 0.5);
          }

          .event-indicator.absent {
            background: #dc3545;
            box-shadow: 0 0 5px rgba(220, 53, 69, 0.5);
          }

          .event-indicator.work-from-home {
            background: #0d6efd;
            box-shadow: 0 0 5px rgba(13, 110, 253, 0.5);
          }

          .event-indicator.late {
            background: #ffc107;
            box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
          }

          .nav-btn {
            background: rgba(0, 255, 135, 0.1);
            border: none;
            color: #00ff87;
            width: 30px;
            height: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .nav-btn:hover {
            background: rgba(0, 255, 135, 0.2);
          }

          .stats-mini {
            margin-top: 1rem;
            padding: 0.8rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            font-size: 0.8rem;
          }

          .stats-mini-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            color: rgba(255, 255, 255, 0.7);
          }

          .stats-mini-value {
            color: #00ff87;
            font-weight: 500;
          }
        `}
      </style>

      {/* Left Sidebar */}
      <div className="date-sidebar">
        <div className="current-date">{currentDate.getDate()}</div>
        <div className="current-day">{DAYS_OF_WEEK[currentDate.getDay()]}</div>
        
        <div className="stats-mini">
          <div className="stats-mini-item">
            <span>Working Days</span>
            <span className="stats-mini-value">{monthStats.workingDays}</span>
          </div>
          <div className="stats-mini-item">
            <span>Present</span>
            <span className="stats-mini-value">{monthStats.presentDays}</span>
          </div>
          <div className="stats-mini-item">
            <span>Absent</span>
            <span className="stats-mini-value">{monthStats.absentDays}</span>
          </div>
          <div className="stats-mini-item">
            <span>Holidays</span>
            <span className="stats-mini-value">{monthStats.holidays}</span>
          </div>
        </div>

        <button className="create-event-btn">
          <FaPlus /> Mark Attendance
        </button>
      </div>

      {/* Main Calendar Area */}
      <div className="calendar-main">
        <div className="month-navigation">
          <div className="year-month">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <div className="d-flex gap-2">
            <button className="nav-btn" onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}>
              <FaChevronLeft />
            </button>
            <button className="nav-btn" onClick={() => setCurrentDate(new Date())}>
              Today
            </button>
            <button className="nav-btn" onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}>
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="calendar-grid-container">
          <Row className="mb-2">
            {DAYS_OF_WEEK.map((day, index) => (
              <Col key={day} className="weekday-header">
                {day.slice(0, 3)}
              </Col>
            ))}
          </Row>

          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <Row key={weekIndex} className="g-0">
              {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dayInfo, dayIndex) => (
                <Col key={dayIndex}>
                  {dayInfo.day && (
                    <div
                      className={`calendar-day 
                        ${dayInfo.isToday ? 'today' : ''} 
                        ${dayInfo.day === currentDate.getDate() ? 'active' : ''}
                        ${dayInfo.isSunday ? 'sunday' : ''}`}
                    >
                      {dayInfo.day}
                      {!dayInfo.isSunday && (
                        <div 
                          className={`event-indicator ${
                            dayInfo.attendance?.toLowerCase().includes('present') 
                              ? 'present'
                              : dayInfo.attendance?.toLowerCase().includes('home')
                                ? 'work-from-home'
                                : dayInfo.attendance?.toLowerCase().includes('late')
                                  ? 'late'
                                  : dayInfo.attendance === 'absent' ? 'absent' : ''
                          }`}
                          style={{
                            background: dayInfo.attendance?.toLowerCase().includes('present')
                              ? '#00ff87'
                              : dayInfo.attendance?.toLowerCase().includes('home')
                                ? '#0d6efd'
                                : dayInfo.attendance?.toLowerCase().includes('late')
                                  ? '#ffc107'
                                  : dayInfo.attendance === 'absent'
                                    ? '#dc3545'
                                    : 'transparent'
                          }}
                        />
                      )}
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          ))}
        </div>

        <div className="mt-3 d-flex justify-content-center gap-4">
          <div className="d-flex align-items-center">
            <div className="event-indicator present me-2" style={{ position: 'static', transform: 'none' }}></div>
            <small className="text-white-50">Present</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="event-indicator absent me-2" style={{ position: 'static', transform: 'none' }}></div>
            <small className="text-white-50">Absent</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="event-indicator work-from-home me-2" style={{ position: 'static', transform: 'none' }}></div>
            <small className="text-white-50">WFH</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="event-indicator late me-2" style={{ position: 'static', transform: 'none' }}></div>
            <small className="text-white-50">Late</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;


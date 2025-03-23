import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaHome,
  FaClock
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
      
      // Check attendance for this day
      const dayRecord = records.find(record => 
        new Date(record.timestamp).toLocaleDateString() === dateString
      );

      if (!isSunday) workingDays++;
      if (dayRecord) presentDays++;
      if (isSunday) holidays++;

      days.push({
        day,
        isCurrentMonth: true,
        isSunday,
        isToday,
        attendance: dayRecord?.status || null,
        timestamp: dayRecord?.timestamp || null
      });
    }

    setCalendarDays(days);
    setMonthStats({
      workingDays,
      presentDays,
      absentDays: workingDays - presentDays,
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
    <Card className="border-0" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px'
    }}>
      <Card.Body className="p-4">
        {/* Calendar Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <FaCalendarAlt style={{color: '#00ff87'}} className=" me-2" size={24} />
            <h4 style={{color: '#00ff87'}} className="mb-0">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none'
              }}
            >
              <FaChevronLeft />
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setCurrentDate(new Date())}
              style={{
                background: 'rgba(13, 110, 253, 0.1)',
                color: 'white',
                border: 'none'
              }}
            >
              Today
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none'
              }}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Month Statistics */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <div style={{
              background: 'rgba(13, 110, 253, 0.1)',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div className="text-white mb-1">Working Days</div>
              <h3 className="mb-0 text-white">{monthStats.workingDays}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div style={{
              background: 'rgba(25, 135, 84, 0.1)',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div className="text-white mb-1">Present Days</div>
              <h3 className="mb-0 text-white">{monthStats.presentDays}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div className="text-white mb-1">Absent Days</div>
              <h3 className="mb-0 text-white">{monthStats.absentDays}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div className="text-white mb-1">Holidays</div>
              <h3 className="mb-0 text-white">{monthStats.holidays}</h3>
            </div>
          </Col>
        </Row>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Day Names */}
          <Row className="text-center mb-3">
            {DAYS_OF_WEEK.map((day, index) => (
              <Col key={day} style={{ color: index === 0 ? '#dc3545' : '#00ff87' }}>
                {day.slice(0, 3)}
              </Col>
            ))}
          </Row>

          {/* Calendar Days */}
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <Row key={weekIndex} className="text-center mb-2">
              {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dayInfo, dayIndex) => (
                <Col key={dayIndex}>
                  {dayInfo.day && (
                    <div
                      style={{
                        padding: '10px',
                        background: dayInfo.isSunday 
                          ? 'rgba(220, 53, 69, 0.1)' 
                          : getStatusColor(dayInfo.attendance),
                        borderRadius: '10px',
                        border: dayInfo.isToday ? '1px solid #00ff87' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                      className="calendar-day"
                    >
                      <div className="d-flex flex-column align-items-center">
                        <span className={
                          dayInfo.isSunday 
                            ? 'text-danger' 
                            : dayInfo.isToday 
                              ? 'text-success' 
                              : 'text-white'
                        }>
                          {dayInfo.day}
                        </span>
                        {dayInfo.attendance && !dayInfo.isSunday && (
                          <div className="mt-1">
                            {getStatusIcon(dayInfo.attendance)}
                          </div>
                        )}
                        {dayInfo.isSunday && (
                          <Badge bg="danger" className="mt-1">Holiday</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AttendanceCalendar;


import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'react-bootstrap';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const user = JSON.parse(sessionStorage.getItem('user')); // Get user directly

  useEffect(() => {
    if (!user) return;
    generateCalendarDays(currentDate);
  }, [currentDate, user]);

  const generateCalendarDays = useCallback((date) => {
    if (!user) return;
    
    // Get attendance records directly
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysFromPrevMonth = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    const today = new Date();
    
    // Add empty slots for previous month days
    for (let i = 0; i < daysFromPrevMonth; i++) {
      days.push({ day: null, isCurrentMonth: false, isToday: false, isPresent: false });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateString = dayDate.toLocaleDateString();
      
      const isPresent = existingRecords.some(record => 
        new Date(record.timestamp).toLocaleDateString() === dateString && 
        record.username === user.username
      );

      const isPastDate = dayDate < today && dayDate.toDateString() !== today.toDateString();
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: dateString === today.toLocaleDateString(),
        isPresent: isPresent,
        isAbsent: isPastDate && !isPresent
      });
    }
    
    // Fill remaining slots
    const totalSlots = 42;
    const remainingSlots = totalSlots - days.length;
    
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false, isPresent: false });
    }
    
    setCalendarDays(days);
  }, [user]);

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="card h-100 border-0" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px'
    }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button 
            variant="link" 
            onClick={prevMonth}
            className="text-decoration-none"
            style={{ color: '#00ff87' }}
          >
            <i className="fas fa-chevron-left"></i>
          </Button>
          <h4 style={{ 
            color: '#00ff87',
            margin: 0,
            fontWeight: 'bold'
          }}>
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h4>
          <Button 
            variant="link" 
            onClick={nextMonth}
            className="text-decoration-none"
            style={{ color: '#00ff87' }}
          >
            <i className="fas fa-chevron-right"></i>
          </Button>
        </div>

        <div className="calendar-grid">
          <div className="row text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={index} className="col" style={{ color: '#ff3333' }}>
                {day}
              </div>
            ))}
          </div>
          
          {calendarDays.length > 0 && Array(6).fill().map((_, rowIndex) => (
            <div key={rowIndex} className="row mb-2">
              {Array(7).fill().map((_, colIndex) => {
                const dayIndex = rowIndex * 7 + colIndex;
                const dayInfo = calendarDays[dayIndex] || { 
                  day: null, 
                  isCurrentMonth: false, 
                  isToday: false, 
                  isPresent: false 
                };
                
                return (
                  <div 
                    key={colIndex} 
                    className="col text-center" 
                    style={{
                      padding: '8px 0',
                      borderRadius: '100%',
                      background: dayInfo.isToday 
                        ? 'rgba(255, 255, 0, 0.2)' 
                        : dayInfo.isPresent 
                          ? 'rgba(0, 255, 0, 0.2)'
                          : dayInfo.isAbsent
                            ? 'rgba(255, 0, 0, 0.2)'
                            : 'transparent',
                      color: !dayInfo.isCurrentMonth 
                        ? '#666666' 
                        : dayInfo.isPresent 
                          ? '#00ff00'
                          : dayInfo.isAbsent
                            ? '#ff0000'
                            : '#ffffff',
                      fontWeight: dayInfo.isToday ? 'bold' : 'normal',
                      border: dayInfo.isToday ? '1px solid yellow' : 'none'
                    }}
                  >
                    {dayInfo.day}
                    {(dayInfo.isPresent || dayInfo.isAbsent) && (
                      <div style={{ 
                        fontSize: '10px', 
                        marginTop: '2px',
                        color: dayInfo.isPresent ? '#00ff00' : '#ff0000'
                      }}>
                        {dayInfo.isPresent ? 'Present' : 'Absent'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar; 
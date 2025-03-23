import React from 'react';
import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const RecentAttendanceRecords = () => {
  const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  return (
    <div className="card border-0" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px'
    }}>
      <div className="card-body p-4">
        <h4 className="mb-4" style={{ color: '#00ff87' }}>
          Recent Attendance Records
        </h4>
        <div className="table-responsive">
          <Table hover className="table-dark table-borderless">
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.05)'
              }}>
                <th>Date & Time</th>
                <th>Username</th>
                <th>Status</th>
                {/* <th>Department</th> */}
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.timestamp}</td>
                  <td> <Link to={`/profile/${record.username}`}> {record.username}</Link></td>
                  <td>
                    <span className="badge" style={{
                      background: record.status === 'Present' 
                        ? 'linear-gradient(45deg, #00ff87, #60efff)'
                        : 'linear-gradient(45deg, #ff6b6b, #ff4b2b)',
                      padding: '8px 12px',
                      borderRadius: '8px'
                    }}>
                      {record.status}
                    </span>
                  </td>
                  {/* <td>{record.department}</td> */}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RecentAttendanceRecords; 
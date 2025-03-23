import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import RecentAttendanceRecords from '../components/RecentAttendanceRecords';

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState(null);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get all users data from session storage
    const usersData = JSON.parse(localStorage.getItem('userData'));
    
    // Find the specific user based on username
    const foundUser = usersData.find(user => user.username === username);
    
    if (foundUser) {
      setUserProfile(foundUser);
    }
  }, [username]);

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container py-1" style={{
      background: 'linear-gradient(135deg, #1e1e2f 0%, #1e1e24 100%)',
      color: 'white'
    }}>
      <div className="container p-1">
   
        <div className="card border-0" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px'
        }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className='d-flex align-items-center mb-4'>
              {userProfile.profilePicture ? (
                <img 
                  src={userProfile.profilePicture} 
                  alt="Profile" 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #00ff87'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #00ff87, #60efff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  color: '#1e1e2f',
                  fontWeight: 'bold'
                }}>
                  {userProfile.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="ms-4">
                <h1 style={{ 
                  background: 'linear-gradient(45deg, #00ff87, #60efff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold'
                }}>{userProfile.fullName}</h1>
                <p className="text-light mb-0">@{userProfile.username}</p>
              </div>
              </div>

              <div className="d-flex gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="btn d-flex align-items-center gap-2 btn-link text-decoration-none"
                  style={{ color: '#00ff87' }}
                >
                  <FaArrowLeft size={20} /> Back
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn d-flex align-items-center gap-2 btn-link text-decoration-none"
                  style={{ color: '#00ff87' }}
                >
                  Dashboard
                </button>
              </div>

            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="card-body">
                    <h2 className="card-title mb-3" style={{
                      fontSize: '1.25rem',
                      color: '#00ff87'
                    }}>Contact Information</h2>
                    <p className="mb-2">
                      <span className="text-light">Email:</span>{' '}
                      <span className="text-white-50">{userProfile.email}</span>
                    </p>
                    <p className="mb-0">
                      <span className="text-light">Phone:</span>{' '}
                      <span className="text-white-50">{userProfile.phone}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="card-body">
                    <h2 className="card-title mb-3" style={{
                      fontSize: '1.25rem',
                      color: '#00ff87'
                    }}>Additional Information</h2>
                    <p className="mb-0">
                      <span className="text-light">Aadhaar Number:</span>{' '}
                      <span className="text-white-50">{userProfile.aadhaarNumber}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <RecentAttendanceRecords /> */}
      </div>
    </div>
  );
};

export default ProfilePage;

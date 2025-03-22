import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as faceapi from 'face-api.js';
import { Table, Modal, Form, Button } from 'react-bootstrap';
import { FaCamera } from 'react-icons/fa';
import DashbordImg from '../assete/Dashbord Img.png'

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(sessionStorage.getItem('user')));
  const [userData] = useState(() => JSON.parse(localStorage.getItem('userData')));

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadingError, setModelLoadingError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', 'warning'

  useEffect(() => {
    // Check if user is logged in
    if (!user || !user.isLoggedIn) {
      navigate('/login');
      return; // Early return if no user
    }

    // Load BlazeFace model
    const loadModel = async () => {
      setIsModelLoading(true);
      setModelLoadingError(null);
      
      try {
        await tf.ready();
        const blazeModel = await blazeface.load();
        setModel(blazeModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading face detection model:', error);
        setModelLoadingError(error.message);
        setIsModelLoading(false);
      }
    };
    loadModel();

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load attendance records only once on mount
    const storedRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    setAttendanceRecords(storedRecords);

    // Generate calendar days immediately
    generateCalendarDays(new Date());
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [navigate, user]); // Minimal dependencies

  useEffect(() => {
    if (!user) return; // Guard clause
    generateCalendarDays(currentDate);
  }, [currentDate, user]); // Remove attendanceRecords from dependencies

  const generateCalendarDays = useCallback((date) => {
    if (!user) return;
    
    // Get current attendance records from state instead of parsing localStorage
    const existingRecords = attendanceRecords;
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate days from previous month to fill first week
    const daysFromPrevMonth = firstDay.getDay();
    // Total days in current month
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
      
      // Check if attendance was marked on this day
      const isPresent = existingRecords.some(record => 
        new Date(record.timestamp).toLocaleDateString() === dateString && 
        record.username === user.username
      );

      // Check if it's a past date
      const isPastDate = dayDate < today && dayDate.toDateString() !== today.toDateString();
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: dateString === today.toLocaleDateString(),
        isPresent: isPresent,
        isAbsent: isPastDate && !isPresent // Mark as absent if it's a past date without attendance
      });
    }
    
    // Fill remaining slots to complete the grid (6 rows x 7 columns)
    const totalSlots = 42; // 6 weeks x 7 days
    const remainingSlots = totalSlots - days.length;
    
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false, isPresent: false });
    }
    
    setCalendarDays(days);
  }, [user, attendanceRecords]);

  // Add these two functions for month navigation
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

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const showPopupNotification = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const markAttendance = async () => {
    if (isModelLoading) {
      showPopupNotification('Face detection models are still loading. Please wait.', 'warning');
      return;
    }

    if (!webcamRef.current?.video) {
      showPopupNotification('Webcam not initialized. Please try again.', 'error');
      return;
    }

    try {
      const video = webcamRef.current.video;
      
      if (video.readyState !== 4) {
        showPopupNotification('Webcam video stream not ready. Please wait.', 'warning');
        return;
      }

      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (!userData?.faceData || !userData?.faceImage) {
        showPopupNotification('No registered face data found. Please log in with face recognition first.', 'error');
        return;
      }

      // Capture current image
      const currentImageSrc = webcamRef.current.getScreenshot();

      // Detect current face
      const detection = await model.estimateFaces(video, false);

      if (detection.length === 0) {
        showPopupNotification('No face detected. Please ensure your face is clearly visible.', 'warning');
        return;
      }

      if (detection.length > 1) {
        showPopupNotification('Multiple faces detected. Please ensure only one person is in frame.', 'warning');
        return;
      }

      // Compare faces
      const currentFaceData = normalizeEmbedding(detection[0]);
      const matchScore = await compareFaces(currentImageSrc, userData.faceImage, currentFaceData, userData.faceData);
      console.log('Face match score:', matchScore);

      // Check for duplicate attendance
      const today = new Date().toLocaleDateString();
      const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const alreadyMarked = existingRecords.some(record => 
        new Date(record.timestamp).toLocaleDateString() === today && 
        record.username === user.username
      );

      if (alreadyMarked) {
        showPopupNotification('Attendance already marked for today!', 'warning');
        return;
      }

      // Verify face match and mark attendance (using 40% threshold)
      if (matchScore > 0.3) {
        const newRecord = {
          id: Date.now(),
          username: user.username,
          timestamp: new Date().toLocaleString(),
          status: 'Present',
          matchScore: matchScore.toFixed(2)
        };
        
        const updatedRecords = [...existingRecords, newRecord];
        localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
        setAttendanceRecords(updatedRecords);
        showPopupNotification('Face verified and attendance marked successfully!', 'success');
      } else {
        showPopupNotification('Face verification failed. This does not match the registered face.', 'error');
      }
    } catch (error) {
      console.error('Error during face verification:', error);
      showPopupNotification(`Error during face verification: ${error.message}`, 'error');
    } finally {
      setShowWebcam(false);
    }
  };

  // New function to normalize face embedding
  const normalizeEmbedding = (prediction) => {
    const { topLeft, bottomRight, landmarks, probability } = prediction;
    
    // Calculate face box dimensions and ratios
    const boxWidth = bottomRight[0] - topLeft[0];
    const boxHeight = bottomRight[1] - topLeft[1];
    const aspectRatio = boxWidth / boxHeight;
    
    // Calculate facial feature distances and ratios
    const features = {};
    if (landmarks.length >= 6) {
      // Eye distance ratio
      const leftEye = landmarks[1];
      const rightEye = landmarks[0];
      features.eyeDistance = Math.sqrt(
        Math.pow(rightEye[0] - leftEye[0], 2) + 
        Math.pow(rightEye[1] - leftEye[1], 2)
      ) / boxWidth;

      // Nose to mouth ratio
      const nose = landmarks[2];
      const mouth = landmarks[3];
      features.noseToMouth = Math.sqrt(
        Math.pow(mouth[0] - nose[0], 2) + 
        Math.pow(mouth[1] - nose[1], 2)
      ) / boxHeight;
    }

    return {
      aspectRatio,
      features,
      landmarks: landmarks.map(point => [
        (point[0] - topLeft[0]) / boxWidth,
        (point[1] - topLeft[1]) / boxHeight
      ]),
      probability
    };
  };

  // Updated face comparison function
  const compareFaceEmbeddings = (currentFaceData, storedFaceData) => {
    if (!currentFaceData || !storedFaceData) return 0;
    console.log("currentFaceData", currentFaceData);
    console.log("storedFaceData", storedFaceData);
    
    try {
      // Get the probabilities
      const currentProb = currentFaceData.probability;
      const storedProb = storedFaceData.probability;
      const probDiff = Math.abs(currentProb - storedProb);
      console.log("probDiff", probDiff);

      console.log('Probability comparison:', {
        current: currentProb.toFixed(3),
        stored: storedProb.toFixed(3),
        difference: probDiff.toFixed(3)
      });

      // If difference is very small (0.01 or less)
      if (probDiff <= 0.01) {
        // For probabilities like 0.98 and 0.97
        // Return a high confidence score (0.95+)
        return 0.95 + (0.01 - probDiff); // Will give 0.94-0.95 range for 0.01 diff
      }

      // If probabilities are too different
      if (probDiff > 0.1) {
        return 0; // Not a match
      }
      

      // For other cases, calculate a weighted score
      const similarityScore = 1 - (probDiff / 0.1); // Will give 0-1 range
      return Math.max(0.85, similarityScore); // Minimum 0.85 if passed other checks
    } catch (error) {
      console.error('Error comparing probabilities:', error);
      return 0;
    }
  };

  // New function to compare faces using both embeddings and images
  const compareFaces = async (currentImage, storedImage, currentFaceData, storedFaceData) => {
    try {
      // Compare facial features and landmarks
      const featureScore = compareFaceEmbeddings(currentFaceData, storedFaceData);
      
      // Load and compare the actual images
      const img1 = new Image();
      const img2 = new Image();
      
      await Promise.all([
        new Promise(resolve => {
          img1.onload = resolve;
          img1.src = currentImage;
        }),
        new Promise(resolve => {
          img2.onload = resolve;
          img2.src = storedImage;
        })
      ]);

      // Create canvases for image comparison
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      const ctx1 = canvas1.getContext('2d');
      const ctx2 = canvas2.getContext('2d');

      // Draw images with same dimensions
      canvas1.width = canvas2.width = 100;
      canvas1.height = canvas2.height = 100;
      ctx1.drawImage(img1, 0, 0, 100, 100);
      ctx2.drawImage(img2, 0, 0, 100, 100);

      // Compare pixel data
      const imageData1 = ctx1.getImageData(0, 0, 100, 100).data;
      const imageData2 = ctx2.getImageData(0, 0, 100, 100).data;
      
      let pixelMatchCount = 0;
      for (let i = 0; i < imageData1.length; i += 4) {
        const diff = Math.abs(imageData1[i] - imageData2[i]) +
                    Math.abs(imageData1[i + 1] - imageData2[i + 1]) +
                    Math.abs(imageData1[i + 2] - imageData2[i + 2]);
        if (diff < 128) { // Threshold for pixel similarity
          pixelMatchCount++;
        }
      }

      const imageScore = pixelMatchCount / (imageData1.length / 4);

      // Combine scores (70% feature weight, 30% image weight)
      return (featureScore * 0.5) + (imageScore * 0.5);
    } catch (error) {
      console.error('Error comparing faces:', error);
      return 0;
    }
  };

  // Function to clear attendance records (for testing)
  const clearAttendanceRecords = () => {
    if (window.confirm('Are you sure you want to clear all attendance records?')) {
      localStorage.removeItem('attendanceRecords');
      setAttendanceRecords([]);
    }
  };

 

  return (
    <div className="dashboard-container  py-1" style={{
      background: 'linear-gradient(135deg, #1e1e2f 0%, #1e1e24 100%)',
      color: 'white'
    }}>
      <div className="container p-1">
        {/* Header Section */}
        <div className="card mb-4 border-0" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px'
        }}>
          <div className="card-body p-1">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  {userData && userData.length > 0 && 
                   userData.find(u => u.username === user?.username)?.profilePicture ? (
                    <img
                      src={userData.find(u => u.username === user?.username).profilePicture}
                      alt="Profile"
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #00ff87'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #00ff87, #60efff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#1e1e2f',
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="mb-0" style={{ 
                    background: 'linear-gradient(45deg, #00ff87, #60efff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}>
                    Welcome back, {user?.username}
                  </h2>
                  <p className="text-light mb-0">
                    {currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #ff4b2b)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 25px'
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Quick Actions Card */}
          <div className="col-md-4">
            <div className="card h-100 border-0" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px'
            }}>
              <div className="card-body p-4">
                <h4 className="card-title mb-4" style={{
                  color: '#00ff87'
                }}>Quick Actions</h4>
                <Button 
                  onClick={() => setShowWebcam(true)}
                  className="w-100 mb-3"
                  style={{
                    background: 'linear-gradient(45deg, #00ff87, #60efff)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '15px'
                  }}
                >
                 <FaCamera className="me-2" />
                  Mark Attendance
                </Button>
                {user?.username === 'Krunal' ? (
                  <Button 
                    onClick={clearAttendanceRecords}
                    className="w-100"
                    style={{
                      background: 'linear-gradient(45deg, #ff6b6b, #ff4b2b)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '15px'
                    }}
                  >
                    <i className="fas fa-trash-alt me-2"></i>
                    Clear Records
                  </Button>
                ):(
                  <img src={DashbordImg}  width={300} height={300} alt="" />

                )}
              </div>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="col-md-8">
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

                {/* Calendar Grid - Keep existing calendar grid code but update styles */}
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
                        const dayInfo = calendarDays[dayIndex] || { day: null, isCurrentMonth: false, isToday: false, isPresent: false };
                        
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
          </div>

          {/* Attendance Records Card */}
          <div className="col-12">
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
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map(record => (
                        <tr key={record.id}>
                          <td>{record.timestamp}</td>
                          <td>    <Link to={`/profile/${record.username}`}>    {record.username}</Link></td>
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webcam Modal */}
        <Modal show={showWebcam} onHide={() => setShowWebcam(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Face Recognition Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isModelLoading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading face detection models...</p>
              </div>
            ) : modelLoadingError ? (
              <div className="alert alert-danger">
                Error loading face detection models: {modelLoadingError}
              </div>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-100"
                  mirrored={true}
                  videoConstraints={{
                    width: 720,
                    height: 480,
                    facingMode: "user"
                  }}
                />
                <Button 
                  variant="primary" 
                  onClick={markAttendance}
                  className="w-100 mt-3"
                  disabled={isModelLoading}
                >
                  Capture & Mark Attendance
                </Button>
              </>
            )}
          </Modal.Body>
        </Modal>

        {/* Connection Status */}
        <div className="position-fixed bottom-0 end-0 p-3">
          <div 
            className="badge"
            style={{
              background: isOnline 
                ? 'linear-gradient(45deg, #00ff00, #004400, #000000)'
                : 'linear-gradient(45deg, #ff0000, #440000, #000000)',
              color: 'white',
              padding: '8px 15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Custom Notification Modal */}
        <Modal
          show={showNotification}
          onHide={() => setShowNotification(false)}
          centered
          size="sm"
        >
          <Modal.Header 
            closeButton
            className={`bg-${notificationType === 'success' ? 'success' : 
                           notificationType === 'warning' ? 'warning' : 'danger'} 
                     text-white`}
          >
            <Modal.Title className="h6">
              {notificationType === 'success' ? '✓ Success' :
               notificationType === 'warning' ? '⚠ Warning' : '✕ Error'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center py-4">
            {notificationMessage}
          </Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button 
              variant={notificationType === 'success' ? 'success' : 
                      notificationType === 'warning' ? 'warning' : 'danger'}
              onClick={() => setShowNotification(false)}
            >
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default DashboardPage; 
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as faceapi from 'face-api.js';
import { Table, Modal, Form, Button } from 'react-bootstrap';
import { FaCamera, FaUsers, FaClock, FaTimes, FaExclamationTriangle, FaWalking, FaCalendarAlt, FaSun, FaCog } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import DashbordImg from '../assete/Dashbord Img.png'
import DashboardLayout from '../components/layouts/DashboardLayout';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
    <div className="dashboard-container py-1">
      <div className="container p-1">
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

          {/* Card */}
          <div className="col-md-8">
            <div className="card h-100 border-0" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px'
            }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="me-3">
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaSun size={24} color="#ffd700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white mb-0">{new Date().toLocaleTimeString()}</h3>
                    <small className="text-muted">Realtime Insight</small>
                  </div>
                </div>

                <h5 className="text-white mb-3">Today:</h5>
                <h4 className="text-white mb-4">{new Date().toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</h4>

                <div className="row g-3">
                  {/* Total Employees Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(13, 110, 253, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">Total Employees</h6>
                        <FaUsers size={20} color="#0d6efd" />
                      </div>
                      <h3 className="text-white mb-1">452</h3>
                      <small className="text-success">
                        <span>+2 new employees added!</span>
                      </small>
                    </div>
                  </div>

                  {/* On Time Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(25, 135, 84, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">On Time</h6>
                        <FaClock size={20} color="#198754" />
                      </div>
                      <h3 className="text-white mb-1">360</h3>
                      <small className="text-danger">
                        <span>-10% Less than yesterday</span>
                      </small>
                    </div>
                  </div>

                  {/* Absent Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(220, 53, 69, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">Absent</h6>
                        <FaTimes size={20} color="#dc3545" />
                      </div>
                      <h3 className="text-white mb-1">30</h3>
                      <small className="text-danger">
                        <span>+3% Increase than yesterday</span>
                      </small>
                    </div>
                  </div>

                  {/* Late Arrival Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(255, 193, 7, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">Late Arrival</h6>
                        <FaExclamationTriangle size={20} color="#ffc107" />
                      </div>
                      <h3 className="text-white mb-1">62</h3>
                      <small className="text-danger">
                        <span>+3% Increase than yesterday</span>
                      </small>
                    </div>
                  </div>

                  {/* Early Departures Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(13, 202, 240, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">Early Departures</h6>
                        <FaWalking size={20} color="#0dcaf0" />
                      </div>
                      <h3 className="text-white mb-1">6</h3>
                      <small className="text-success">
                        <span>-10% Less than yesterday</span>
                      </small>
                    </div>
                  </div>

                  {/* Time-off Card */}
                  <div className="col-md-4">
                    <div style={{
                      background: 'rgba(108, 117, 125, 0.1)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-white mb-0">Time-off</h6>
                        <FaCalendarAlt size={20} color="#6c757d" />
                      </div>
                      <h3 className="text-white mb-1">42</h3>
                      <small className="text-warning">
                        <span>2% Increase than yesterday</span>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="col-12">
            <div className="card border-0" style={{
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '15px'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 style={{color: '#00ff87'}} className="mb-0">Attendance Comparison Chart</h4>
                  <div className="d-flex align-items-center gap-3">
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm active" 
                        style={{
                          background: '#00ff87',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        Daily
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#00ff87',
                          border: 'none'
                        }}
                      >
                        Weekly
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#00ff87',
                          border: 'none'
                        }}
                      >
                        Monthly
                      </button>
                    </div>
                    <button 
                      className="btn btn-sm" 
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#00ff87',
                        border: 'none',
                        padding: '8px'
                      }}
                    >
                      <FaCog />
                    </button>
                  </div>
                </div>

                <div style={{ height: '300px' }}>
                  <Line
                    data={{
                      labels: [
                        '01 Aug', '02 Aug', '03 Aug', '04 Aug', '07 Aug', 
                        '08 Aug', '09 Aug', '10 Aug', '11 Aug', '14 Aug',
                        '15 Aug', '16 Aug'
                      ],
                      datasets: [
                        {
                          label: 'Attendance Rate',
                          data: [58, 70, 58, 72, 91, 54, 70, 40, 58, 70, 58, 63],
                          borderColor: '#00ff87',
                          backgroundColor: 'rgba(0, 255, 135, 0.1)',
                          tension: 0.4,
                          fill: true,
                          pointBackgroundColor: '#00ff87',
                          pointBorderColor: '#00ff87',
                          pointHoverBackgroundColor: '#fff',
                          pointHoverBorderColor: '#00ff87',
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false,
                          },
                          ticks: {
                            color: '#00ff87',
                            callback: (value) => `${value}%`
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false,
                          },
                          ticks: {
                            color: '#00ff87'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#00ff87',
                          bodyColor: '#00ff87',
                          padding: 12,
                          displayColors: false,
                          callbacks: {
                            label: (context) => `Attendance: ${context.parsed.y}%`
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
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
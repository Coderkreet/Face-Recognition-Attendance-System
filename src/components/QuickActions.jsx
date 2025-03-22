import React, { useState, useRef } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaCamera } from 'react-icons/fa';
import Webcam from 'react-webcam';
import DashbordImg from '../assete/Dashbord Img.png';

const QuickActions = ({ user, model, isModelLoading, modelLoadingError }) => {
  // States
  const [showWebcam, setShowWebcam] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const webcamRef = useRef(null);

  const showPopupNotification = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  // Face detection and attendance marking functions
  const normalizeEmbedding = (prediction) => {
    const { topLeft, bottomRight, landmarks, probability } = prediction;
    
    const boxWidth = bottomRight[0] - topLeft[0];
    const boxHeight = bottomRight[1] - topLeft[1];
    const aspectRatio = boxWidth / boxHeight;
    
    const features = {};
    if (landmarks.length >= 6) {
      const leftEye = landmarks[1];
      const rightEye = landmarks[0];
      features.eyeDistance = Math.sqrt(
        Math.pow(rightEye[0] - leftEye[0], 2) + 
        Math.pow(rightEye[1] - leftEye[1], 2)
      ) / boxWidth;

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

  const compareFaceEmbeddings = (currentFaceData, storedFaceData) => {
    if (!currentFaceData || !storedFaceData) return 0;
    
    try {
      const probDiff = Math.abs(currentFaceData.probability - storedFaceData.probability);
      
      if (probDiff <= 0.01) return 0.95;
      if (probDiff > 0.1) return 0;
      
      return 1 - (probDiff / 0.1);
    } catch (error) {
      console.error('Error comparing probabilities:', error);
      return 0;
    }
  };

  const compareFaces = async (currentImage, storedImage, currentFaceData, storedFaceData) => {
    try {
      const featureScore = compareFaceEmbeddings(currentFaceData, storedFaceData);
      return featureScore;
    } catch (error) {
      console.error('Error comparing faces:', error);
      return 0;
    }
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

      const currentImageSrc = webcamRef.current.getScreenshot();
      const detection = await model.estimateFaces(video, false);

      if (detection.length === 0) {
        showPopupNotification('No face detected. Please ensure your face is clearly visible.', 'warning');
        return;
      }

      if (detection.length > 1) {
        showPopupNotification('Multiple faces detected. Please ensure only one person is in frame.', 'warning');
        return;
      }

      const currentFaceData = normalizeEmbedding(detection[0]);
      const matchScore = await compareFaces(currentImageSrc, userData.faceImage, currentFaceData, userData.faceData);

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

  return (
    <div className="card h-100 border-0" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px'
    }}>
      <div className="card-body p-4">
        <h4 className="card-title mb-4" style={{ color: '#00ff87' }}>Quick Actions</h4>
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
            onClick={() => {}}
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
        ) : (
          <img src={DashbordImg} width={300} height={300} alt="" />
        )}

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

        {/* Notification Modal */}
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

export default QuickActions;
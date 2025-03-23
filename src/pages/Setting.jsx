import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBriefcase, FaCamera, FaCheck, FaTimes } from 'react-icons/fa';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const Setting = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    profilePicture: null,
    faceData: null,
    faceImage: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showWebcam, setShowWebcam] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 720,
    height: 400,
    facingMode: "user"
  };

  useEffect(() => {
    // Get current user's data
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const usersData = JSON.parse(localStorage.getItem('userData'));
    const userData = usersData.find(user => user.username === currentUser?.username);
    
    if (userData) {
      setUserProfile(userData);
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        profilePicture: userData.profilePicture || null,
        faceData: userData.faceData || null,
        faceImage: userData.faceImage || null
      });
    }
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const blazeModel = await blazeface.load();
        setModel(blazeModel);
        console.log('BlazeFace model loaded successfully');
      } catch (error) {
        console.error('Error loading BlazeFace model:', error);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    let interval;
    if (showWebcam && model) {
      interval = setInterval(async () => {
        try {
          const isDetected = await checkForFace();
          setFaceDetected(isDetected);
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [showWebcam, model]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const checkForFace = async () => {
    if (webcamRef.current?.video?.readyState === 4 && model) {
      const predictions = await model.estimateFaces(webcamRef.current.video, false);
      return predictions.length > 0;
    }
    return false;
  };

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

  const handleFaceCapture = async () => {
    if (!showWebcam) {
      setShowWebcam(true);
      return;
    }

    try {
      const hasFace = await checkForFace();
      if (!hasFace) {
        alert('No face detected. Please position your face in front of the camera.');
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      const predictions = await model.estimateFaces(webcamRef.current.video, false);
      
      if (predictions.length > 0) {
        const prediction = predictions[0];
        const faceData = normalizeEmbedding(prediction);
        
        setFormData(prev => ({
          ...prev,
          faceData: faceData,
          faceImage: imageSrc
        }));
        
        setShowWebcam(false);
        setMessage({ text: 'Face data updated successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      setMessage({ text: 'Failed to capture face. Please try again.', type: 'error' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const usersData = JSON.parse(localStorage.getItem('userData'));
      const updatedUsers = usersData.map(user => 
        user.username === userProfile.username 
          ? { 
              ...user, 
              ...formData,
              faceData: formData.faceData || user.faceData,
              faceImage: formData.faceImage || user.faceImage
            } 
          : user
      );
      
      localStorage.setItem('userData', JSON.stringify(updatedUsers));
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      setUserProfile(prev => ({ ...prev, ...formData }));
    } catch (error) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    }

    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container py-4" style={{
      background: 'linear-gradient(135deg, #1e1e2f 0%, #1e1e24 100%)',
      color: 'white',
      minHeight: '100vh'
    }}>
      <div className="container">
        <div className="card border-0" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px'
        }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0" style={{
                background: 'linear-gradient(45deg, #00ff87, #60efff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>Profile Settings</h2>
              <button
                className="btn btn-outline-light"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #00ff87'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #00ff87, #60efff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      color: '#1e1e2f'
                    }}>
                      {formData.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isEditing && (
                    <label className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 cursor-pointer">
                      <FaCamera color="white" />
                      <input
                        type="file"
                        className="d-none"
                        onChange={handleProfilePictureChange}
                        accept="image/*"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  {showWebcam && (
                    <div className="webcam-container position-fixed top-50 start-50 translate-middle" 
                         style={{ 
                           zIndex: 1000,
                           width: '100%',
                           maxWidth: '720px',
                           backgroundColor: '#1e1e2f',
                           padding: '20px',
                           borderRadius: '15px',
                           boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                         }}>
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored={true}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-100"
                        style={{ borderRadius: '10px' }}
                      />
                      <div className={`face-detection-status ${faceDetected ? 'detected' : 'not-detected'}`}
                           style={{
                             position: 'absolute',
                             bottom: '60px',
                             left: '50%',
                             transform: 'translateX(-50%)',
                             padding: '5px 10px',
                             borderRadius: '5px',
                             backgroundColor: faceDetected ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
                             color: 'white'
                           }}>
                        {faceDetected ? 'Face Detected' : 'No Face Detected'}
                      </div>
                      <div className="mt-3 d-flex justify-content-center gap-2">
                        <button 
                          className="btn btn-success"
                          onClick={handleFaceCapture}
                          disabled={!faceDetected}
                        >
                          Capture Face
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => setShowWebcam(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-primary mt-3"
                    onClick={() => setShowWebcam(true)}
                  >
                    <FaCamera className="me-2" />
                    Update Face Data
                  </button>
                )}
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label text-light">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaUser /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label text-light">Email</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaEnvelope /></span>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label text-light">Phone</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaPhone /></span>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label text-light">Department</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaBriefcase /></span>
                      <select
                        className="form-select"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={!isEditing}
                      >
                        <option value="">Select Department</option>
                        <option value="Development">Development</option>
                        <option value="HR">Human Resources</option>
                        <option value="Management">Management</option>
                        <option value="Support">Support</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Research">Research & Development</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="text-center mt-4">
                  <button type="submit" className="btn btn-success me-2">
                    <FaCheck className="me-2" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        fullName: userProfile.fullName || '',
                        email: userProfile.email || '',
                        phone: userProfile.phone || '',
                        department: userProfile.department || '',
                        profilePicture: userProfile.profilePicture || null,
                        faceData: userProfile.faceData || null,
                        faceImage: userProfile.faceImage || null
                      });
                    }}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;

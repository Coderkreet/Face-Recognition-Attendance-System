import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaIdCard, FaPhone, FaCamera, FaBriefcase } from 'react-icons/fa';
import './LoginPage.css'; // We can reuse the login page styles
import GradientBackground from '../components/GradientBackground';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import loginimg from '../assete/—Pngtree—intelligent technology_5626635.png';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    aadhaarNumber: '',
    faceData: null,
    faceImage: null,
    profilePicture: null,
    department: ''
  });

  const [isFaceCaptured, setIsFaceCaptured] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [model, setModel] = useState(null);

  const videoConstraints = {
    width: 720,
    height: 400,
    facingMode: "user"
  };

  // Load BlazeFace model
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

  // Face detection interval
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
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
        
        setIsFaceCaptured(true);
        setShowWebcam(false);
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      alert('Failed to capture face. Please try again.');
    }
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

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (formData.aadhaarNumber.length !== 12 || !/^\d+$/.test(formData.aadhaarNumber)) {
      alert("Please enter a valid 12-digit Aadhaar number!");
      return;
    }

    if (!isFaceCaptured) {
      alert("Please capture your face before registering!");
      return;
    }

    // Get existing userData array from localStorage or initialize empty array
    let userData = JSON.parse(localStorage.getItem('userData')) || [];

    // Check if user already exists
    const userExists = userData.some(user => 
      user.aadhaarNumber === formData.aadhaarNumber || 
      user.email === formData.email
    );

    if (userExists) {
      alert("User with this Aadhaar number or email already exists!");
      return;
    }

    // Add new user to array
    userData.push({
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password, // Save password
      aadhaarNumber: formData.aadhaarNumber,
      faceData: formData.faceData,
      faceImage: formData.faceImage,
      profilePicture: formData.profilePicture,
      department: formData.department
    });

    // Save updated array back to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));

    toast.success("Registration successful!");
    navigate('/login');
  };


  return (
    <>
      <GradientBackground />
      <div className="login-container d-flex align-items-center justify-content-center min-vh-100">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            <div className="col-sm-7 d-flex flex-column align-items-center">
              {showWebcam ? (
                <div className="webcam-container" style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>
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
                         bottom: '10px',
                         left: '50%',
                         transform: 'translateX(-50%)',
                         padding: '5px 10px',
                         borderRadius: '5px',
                         backgroundColor: faceDetected ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
                         color: 'white'
                       }}>
                    {faceDetected ? 'Face Detected' : 'No Face Detected'}
                  </div>
                </div>
              ) : (
                <>
                  <img src={loginimg} alt="loginimg" style={{height:'50%', width:'50%'}} />
                  <p className="mb-2 text-light fs-5">
                    <b>Face Recognition Attendance System</b>
                  </p>
                  <p className='text-light fs-5'>
                    <b>Register with Aadhaar for secure attendance tracking</b>
                  </p>
                </>
              )}
            </div>
            
            <div className="col-sm-5">
              <div className="card login-card shadow-sm p-4" style={{backgroundColor:'#0000005e'}}>
                <h2 className="card-title text-center mb-4 text-light">Register</h2>
                
                <div className="d-flex justify-content-center mb-4">
                  <button 
                    type="button" 
                    className="btn face-recognition-btn"
                    onClick={handleFaceCapture}
                    style={{
                      backgroundColor: isFaceCaptured ? '#28a745' : '#ff5e00',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  >
                    <FaCamera className="me-2" />
                    {showWebcam ? 'Capture Face' : (isFaceCaptured ? 'Face Captured ✓' : 'Enable Face Recognition')}
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="username" className="form-label text-light">Username</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          placeholder="Enter your username"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="fullName" className="form-label text-light">Full Name</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label text-light">Email</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label text-light">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaPhone />
                        </span>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="department" className="form-label text-light">Department</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaBriefcase />
                        </span>
                        <select
                          className="form-select"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: '#333'
                          }}
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

                    <div className="col-md-6 mb-3">
                      <label htmlFor="aadhaarNumber" className="form-label text-light">Aadhaar Number</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaIdCard />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="aadhaarNumber"
                          name="aadhaarNumber"
                          value={formData.aadhaarNumber}
                          onChange={handleChange}
                          required
                          maxLength="12"
                          pattern="\d{12}"
                          placeholder="Enter 12-digit Aadhaar number"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label text-light">Password</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="Create password"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label text-light">Confirm Password</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="profilePicture" className="form-label text-light">Profile Picture</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaCamera />
                        </span>
                        <input
                          type="file"
                          className="form-control"
                          id="profilePicture"
                          name="profilePicture"
                          onChange={handleProfilePictureChange}
                          accept="image/*"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-dark" 
                      style={{backgroundColor:'#ff5e00'}}
                      disabled={!isFaceCaptured}
                    >
                      Register
                    </button>
                  </div>
                </form>
               
                <p className="text-center mt-3 text-light">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .face-recognition-btn {
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          transition: all 0.3s ease;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .face-recognition-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default RegisterPage; 
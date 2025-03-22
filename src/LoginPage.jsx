import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import { FaCamera, FaEnvelope, FaLock } from 'react-icons/fa'; // Import icons from react-icons
import './LoginPage.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import GradientBackground from './GradientBackground';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import Loinimg from './assete/—Pngtree—intelligent technology_5626635.png'

const Loginpage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    rememberMe: false,
    useWebcam: false,
  });
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [model, setModel] = useState(null);
  const formDataRef = useRef(formData);
  const [isVerifying, setIsVerifying] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState(null);

  const videoConstraints = {
    width: 720,
    height: 400,
    facingMode: "user"
  };

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    // Here you would typically:
    // 1. Send this image to your backend
    // 2. Process it for face recognition
    console.log("Captured image:", imageSrc);
    // Temporary alert for demo
    window.alert('Face capture successful!');
  }, [webcamRef]);

  // Replace the face-api.js model loading with BlazeFace
  React.useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow backend ready:', tf.getBackend());
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
    formDataRef.current = formData;
  }, [formData]);

  // Update face detection interval - remove navigation logic
  useEffect(() => {
    let interval;
    if (showWebcam && model) {
      interval = setInterval(async () => {
        try {
          const isDetected = await checkForFace();
          setFaceDetected(isDetected);
        } catch (error) {
          console.error('Face detection error:', error);
          setIsVerifying(false);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [showWebcam, model]);

  // Simplified checkForFace function
  const checkForFace = async () => {
    if (webcamRef.current?.video?.readyState === 4 && model) {
      const predictions = await model.estimateFaces(webcamRef.current.video, false);
      return predictions.length > 0;
    }
    return false;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const valueToUse = type === 'checkbox' ? checked : value;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: valueToUse }));
    
    if (name === 'useWebcam') {
      setShowWebcam(checked);
    }
  };

  // Update the normalizeEmbedding function
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

  // Update the handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (formData.useWebcam) {
      if (!formData.username.trim()) {
        window.alert('Please enter a username before proceeding with face recognition.');
        return;
      }

      setIsVerifying(true);
      try {
        const hasFace = await checkForFace();
        if (!hasFace) {
          window.alert('No face detected. Please position your face in front of the camera.');
          setIsVerifying(false);
          return;
        }

        // Capture the webcam image
        const imageSrc = webcamRef.current.getScreenshot();

        // Get face embedding
        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        if (predictions.length > 0) {
          const prediction = predictions[0];
          const faceData = normalizeEmbedding(prediction);

          // Store both face data and image
          if (formData.username) {
            localStorage.setItem('user', JSON.stringify({
              username: formData.username,
              isLoggedIn: true,
              faceData: faceData,
              faceImage: imageSrc // Store the face image
            }));
            navigate('/dashboard');
          }
        } else {
          window.alert('Could not process face. Please try again.');
        }
      } catch (error) {
        console.error('Error during face recognition login:', error);
        window.alert('An error occurred during face recognition. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Remove the regular login flow since we only want face recognition login
      window.alert('Please enable face recognition to login.');
      return;
    }
  };

  return (
    <>
      <GradientBackground />
      <div className="login-container d-flex align-items-center justify-content-center min-vh-100">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            {!showWebcam ? (
              <div className="col-sm-7 d-flex flex-column align-items-center">
               {/* img */}
               <img src={Loinimg} alt="login" className='w-75 h-75 animated-image'/>
                <div className="text-center">
                  <p className="mb-2 text-light fs-5">
                    <b>Face Recognition Attendance System</b>
                  </p>
                  <p className='text-light fs-5'>
                    <b>Secure and efficient attendance tracking with facial recognition technology</b>
                  </p>
                </div>
              </div>
            ) : (
              <div className="col-sm-7 d-flex flex-column align-items-center">
                <div className="webcam-container" style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-100"
                    style={{ borderRadius: '10px' }}
                  />
                  {showWebcam && (
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
                  )}
                </div>
              </div>
            )}
            <div className="col-sm-5">
              <div className="card login-card shadow-sm p-4" style={{backgroundColor:'#0000005e'}}>
                <h2 className="card-title text-center mb-4 text-light">Login</h2>
                <form onSubmit={handleSubmit}>
                  {!showWebcam && (
                    <>
                      <div className="form-group mb-3 position-relative">
                        <label htmlFor="username" className="form-label text-light">Username or email</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaEnvelope />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Enter username or email"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="d-flex justify-content-center mb-3">
                    <button
                      type="button"
                      className={`btn w-100 face-recognition-btn ${formData.useWebcam ? 'active' : ''}`}
                      onClick={() => handleChange({
                        target: {
                          name: 'useWebcam',
                          type: 'checkbox',
                          checked: !formData.useWebcam
                        }
                      })}
                    >
                      <FaCamera className="me-2" />
                      {formData.useWebcam ? 'Disable Face Recognition' : 'Enable Face Recognition'}
                    </button>
                  </div>
                  {!showWebcam && (
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                      />
                      <label className="form-check-label text-light" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                  )}
                  {showWebcam && (
                    <div className="form-group mb-3">
                      <label htmlFor="username" className="form-label text-light">Username</label>
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
                  )}
                  <div className="d-flex justify-content-center mb-3">
                    <button type="submit" className="btn btn-dark w-50 h-35" style={{backgroundColor:'#ff5e00'}}>
                      {formData.useWebcam ? 'Start Face Recognition' : 'Login'}
                    </button>
                  </div>
                </form>
                <p className="text-center mt-3 text-light">
                  New user?{' '}
                  <Link to="/register" className="text-primary">
                    Register with Aadhaar
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`

        .bg {
background: linear-gradient(135deg, rgb(30, 30, 47) 0%, rgb(30, 30, 36) 100%);        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(50px); /* Start slightly below */
          }
          to {
            opacity: 1;
            transform: translateY(0); /* End at original position */
          }
        }

        .animated-image {
          animation: fadeIn 2s ease-in-out infinite;
        }

        .face-recognition-btn {
          background-color: #ff5e00;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          transition: all 0.3s ease;
          font-weight: 500;
          letter-spacing: 0.5px;
          max-width: 300px;
        }

        .face-recognition-btn:hover {
          background-color: #ff7a33;
          transform: translateY(-2px);
        }

        .face-recognition-btn.active {
          background-color: #cc4b00;
        }
      `}</style>
    </>
  );
};

export default Loginpage;

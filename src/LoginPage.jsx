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
import { Modal } from 'react-bootstrap';

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
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const videoConstraints = {
    width: 1400,
    height: 1000,
    facingMode: "user"
  };



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

  // Update the compareFaceEmbeddings function
  const compareFaceEmbeddings = (currentFaceData, storedFaceData) => {
    if (!currentFaceData || !storedFaceData) return 0;
    
    try {
      // Get the probabilities
      const currentProb = currentFaceData.probability;
      const storedProb = storedFaceData.probability;
      const probDiff = Math.abs(currentProb - storedProb);

      console.log('Probability comparison:', {
        current: currentProb.toFixed(3),
        stored: storedProb.toFixed(3),
        difference: probDiff.toFixed(3)
      });

      // If difference is very small (0.01 or less)
      if (probDiff <= 0.01) {
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

  // Add the compareFaces function
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

      // Combine scores (50% feature weight, 50% image weight)
      return (featureScore * 0.5) + (imageScore * 0.5);
    } catch (error) {
      console.error('Error comparing faces:', error);
      return 0;
    }
  };

  // Add this function to handle showing alerts
  const showAlert = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  // Update the handleSubmit function - showing only the alert replacements
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (formData.useWebcam) {
      if (!formData.username.trim()) {
        showAlert('Please enter a username before proceeding with face recognition.');
        return;
      }

      setIsVerifying(true);
      try {
        const hasFace = await checkForFace();
        if (!hasFace) {
          showAlert('No face detected. Please position your face in front of the camera.');
          setIsVerifying(false);
          return;
        }

        const storedUsersData = JSON.parse(localStorage.getItem('userData') || '[]');
        if (!storedUsersData.length) {
          showAlert('No registered users found. Please register first.');
          setIsVerifying(false);
          return;
        }

        // Find the user with matching username
        const userData = storedUsersData.find(user => user.username === formData.username);
        if (!userData) {
          showAlert('Username not found. Please check your username.');
          setIsVerifying(false);
          return;
        }

        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        if (predictions.length > 0) {
          const prediction = predictions[0];
          const currentFaceData = normalizeEmbedding(prediction);
          const currentImage = webcamRef.current.getScreenshot();
          
          // Compare faces using the new method
          const matchScore = await compareFaces(
            currentImage,
            userData.faceImage,
            currentFaceData,
            userData.faceData
          );

          console.log('Face match score:', matchScore);

          if (matchScore > 0.35) {
            sessionStorage.setItem('user', JSON.stringify({
              username: formData.username,
              isLoggedIn: true,
              faceData: currentFaceData,
              faceImage: currentImage
            }));
            navigate('/dashboard');
          } else {
            showAlert('Face verification failed. Please try again.');
          }
        } else {
          showAlert('Could not process face. Please try again.');
        }
      } catch (error) {
        console.error('Error during face recognition login:', error);
        showAlert('An error occurred during face recognition. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    } else {
      showAlert('Please enable face recognition to login.');
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
                    mirrored={true}
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
                    Register with Face
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
          0% {
            opacity: 1;
            transform: translateY(20px);
          }
          50% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(20px);
          }
        }

        .animated-image {
          animation: fadeIn 3s ease-in-out infinite;
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
      
      {/* Add this Modal component before the closing tag */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#ff5e00', color: 'white' }}>
          <Modal.Title>Alert</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <button
            className="btn"
            style={{ backgroundColor: '#ff5e00', color: 'white' }}
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Loginpage;

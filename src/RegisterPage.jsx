import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaIdCard, FaPhone } from 'react-icons/fa';
import './LoginPage.css'; // We can reuse the login page styles
import 'bootstrap/dist/css/bootstrap.min.css';
import GradientBackground from './GradientBackground';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showAadhaarLogin, setShowAadhaarLogin] = useState(false);
  const [aadhaarLoginData, setAadhaarLoginData] = useState({
    aadhaarNumber: '',
    otp: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    aadhaarNumber: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleAadhaarLoginChange = (event) => {
    const { name, value } = event.target;
    setAadhaarLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (formData.aadhaarNumber.length !== 12) {
      alert("Please enter a valid 12-digit Aadhaar number!");
      return;
    }

    // Here you would typically:
    // 1. Validate Aadhaar number with backend
    // 2. Create user account
    // 3. Store user data
    
    sessionStorage.setItem('user', JSON.stringify({
      username: formData.email,
      fullName: formData.fullName,
      isLoggedIn: true
    }));

    navigate('/dashboard');
  };

  const handleAadhaarLogin = (event) => {
    event.preventDefault();
    // Here you would:
    // 1. Validate Aadhaar number
    // 2. Send OTP to registered mobile/email
    // 3. Verify OTP
    // 4. Log user in
    console.log('Aadhaar login attempted:', aadhaarLoginData);
  };

  return (
    <>
      <GradientBackground />
      <div className="login-container d-flex align-items-center justify-content-center min-vh-100">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            <div className="col-sm-7 d-flex flex-column align-items-center">
              <div className="text-center">
                <p className="mb-2 text-light fs-5">
                  <b>Face Recognition Attendance System</b>
                </p>
                <p className='text-light fs-5'>
                  <b>Register with Aadhaar for secure attendance tracking</b>
                </p>
              </div>
            </div>
            
            <div className="col-sm-5">
              <div className="card login-card shadow-sm p-4" style={{backgroundColor:'#0000005e'}}>
                {!showAadhaarLogin ? (
                  <>
                    <h2 className="card-title text-center mb-4 text-light">Register</h2>
                    <div className="d-flex justify-content-center mb-3">
                      <button 
                        onClick={() => setShowAadhaarLogin(true)}
                        className="btn btn-outline-light w-75"
                      >
                        Login with Aadhaar Instead
                      </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group mb-3">
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

                      <div className="form-group mb-3">
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

                      <div className="form-group mb-3">
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

            
                      {/* <div className="form-group mb-3">
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
                      </div> */}

                      <div className="form-group mb-3">
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

                      <div className="form-group mb-3">
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

                      <div className="d-flex justify-content-center mb-3">
                        <button type="submit" className="btn btn-dark w-50" style={{backgroundColor:'#ff5e00'}}>
                          Register
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="card-title text-center mb-4 text-light">Aadhaar Login</h2>
                    <form onSubmit={handleAadhaarLogin}>
                      <div className="form-group mb-3">
                        <label htmlFor="aadhaarLoginNumber" className="form-label text-light">Aadhaar Number</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaIdCard />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            id="aadhaarLoginNumber"
                            name="aadhaarNumber"
                            value={aadhaarLoginData.aadhaarNumber}
                            onChange={handleAadhaarLoginChange}
                            required
                            maxLength="12"
                            pattern="\d{12}"
                            placeholder="Enter 12-digit Aadhaar number"
                          />
                        </div>
                      </div>

                      <div className="form-group mb-3">
                        <label htmlFor="otp" className="form-label text-light">OTP</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            id="otp"
                            name="otp"
                            value={aadhaarLoginData.otp}
                            onChange={handleAadhaarLoginChange}
                            required
                            maxLength="6"
                            pattern="\d{6}"
                            placeholder="Enter OTP"
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-center mb-3">
                        <button type="submit" className="btn btn-dark w-50" style={{backgroundColor:'#ff5e00'}}>
                          Login
                        </button>
                      </div>
                    </form>
                    <div className="d-flex justify-content-center mb-3">
                      <button 
                        onClick={() => setShowAadhaarLogin(false)}
                        className="btn btn-outline-light"
                      >
                        Back to Registration
                      </button>
                    </div>
                  </>
                )}
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
    </>
  );
};

export default RegisterPage; 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa'; // Import the envelope icon
import GradientBackground from './GradientBackground';
// import 'bootstrap/dist/css/bootstrap.min.css';

const ForgetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Password reset email sent to:', email);
    setMessage('Password reset email sent. Please check your inbox.');
    window.alert('Password reset email sent. Please check your inbox.');
  };

  return (
    <>
    <GradientBackground />
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-sm-12 mt-5 text-center">
            <div className="d-none d-sm-block" style={{height : '3rem'}}></div>
          <img
            src="assete/img4.png"
            className="img-fluid rounded mx-auto d-block mb-4 mt-3"
            alt="Forgot Password"
          />
          <p className='text-light fs-5'>
            <b>We will send you an email to reset your password.</b>
          </p>
        </div>

        <div className="col-md-5 mt-5 col-sm-12">
            <div className="d-none d-sm-block" style={{height : '5rem'}}></div>
          <div className="card shadow mt-5" style={{ backgroundColor: '#0000005e' }}>
            <div className="card-body">
              <h2 className="card-title text-center mb-4 text-light">Forgot Password</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-4">
                  <label htmlFor="email" className="form-label text-light mb-4 ">Email address</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <button type="submit" className="btn w-50 d-block mx-auto" style={{ backgroundColor: '#ff5e00' }}>
                  Reset Password
                </button>
              </form>
              
              {message && (
                <p className="text-center mx-auto bg-success p-2 text-light border mt-4 fs-5">
                  {message}
                </p>
              )}

              <p className="text-center mt-4 text-light">
                Remembered your password?{' '}
                <Link to="/" className="text-primary">
                  Login
                </Link>
              </p>
            </div>
          </div>
          <div className="d-block d-sm-none" style={{height : '5rem'}}></div>
            </div>
          </div>
    </div>
    </>
  );
};

export default ForgetPasswordPage;

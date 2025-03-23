import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBriefcase, FaCamera, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setUserProfile(prev => ({ ...prev, ...formData }));
    } catch (error) {
      toast.error('Failed to update profile.');
    }
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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FaBars, FaCalendar, FaCog, FaFile, FaHome, FaTimes, FaUser } from 'react-icons/fa'; // Import icons

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSidebarOpen(width > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: <FaHome />
    },
    { 
      label: 'Calendar', 
      path: '/calendar', 
      icon: <FaCalendar />
    },
    { 
      label: 'Records', 
      path: '/records', 
      icon: <FaFile />
    },
    { 
      label: 'Profile', 
      path: `/profile/${user?.username}`, 
      icon: <FaUser />
    },
    { 
      label: 'Settings', 
      path: '/settings', 
      icon: <FaCog />
    }
  ];

  const handleNavigation = (path) => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-wrapper" style={{ 
      height: '100vh',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998
          }}
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="sidebar-toggle"
        style={{
          position: 'fixed',
          left: isMobile ? '20px' : (isSidebarOpen ? '270px' : '20px'),
          top: '20px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ff87',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          overflowX:"hidden"
          
        }}
        
      >
        {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'rgba(30, 30, 47, 0.9)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        height: '100vh',
        position: 'fixed',
        left: isSidebarOpen ? 0 : '-250px',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.3s ease',
        zIndex: 999,
        backdropFilter: 'blur(10px)',
        boxShadow: isSidebarOpen && isMobile ? '0 0 15px rgba(0,0,0,0.5)' : 'none',
        overflowX: 'hidden'
      }}>
        <div className="mb-4 pt-4">
          <h3 style={{
            background: 'linear-gradient(45deg, #00ff87, #60efff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Dashboard
          </h3>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 15px',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                marginBottom: '8px',
                transition: 'all 0.3s ease',
                background: currentPath === item.path 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              className={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
            >
              <span style={{ 
                marginRight: '10px', 
                fontSize: '20px',
                minWidth: '24px'
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '20px 0' }}>
          <Button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'linear-gradient(45deg, #ff6b6b, #ff4b2b)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px'
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        key={currentPath}
        style={{ 
          marginLeft: isSidebarOpen ? '250px' : '0',
          flex: 1,
          background: 'linear-gradient(135deg, #1e1e2f 0%, #1e1e24 100%)',
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          transition: 'margin-left 0.3s ease',
          padding: '20px',
          paddingTop: '30px'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout; 
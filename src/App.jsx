import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ForgetPasswordPage from './ForgotPs';
import Loginpage from './LoginPage';
import DashboardPage from './Dashboard/DashboardPage';
import RegisterPage from './RegisterPage';
import ProfilePage from './ProfilePage';

// Add Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  
  if (!user || !user.isLoggedIn) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loginpage />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;

import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ForgetPasswordPage from './pages/ForgotPs';
import Loginpage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardLayout from './components/layouts/DashboardLayout';
import AttendanceCalendar from './components/AttendanceCalendar'
import RecentAttendanceRecords from './components/RecentAttendanceRecords';
import Setting from './pages/Setting';

// Add Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  
  if (!user || !user.isLoggedIn) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
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
        <Route path="/calendar" element={
          <ProtectedRoute>
            <AttendanceCalendar />
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute>
            <RecentAttendanceRecords />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;

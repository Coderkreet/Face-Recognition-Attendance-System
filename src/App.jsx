import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ForgetPasswordPage from './pages/ForgotPs';
import Loginpage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AttendanceCalendar from './components/AttendanceCalendar';
import RecentAttendanceRecords from './components/RecentAttendanceRecords';
import Setting from './pages/Setting';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Loginpage />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/calendar" element={<AttendanceCalendar />} />
          <Route path="/records" element={<RecentAttendanceRecords />} />
          <Route path="/settings" element={<Setting />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

import { Outlet, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layouts/DashboardLayout';

const ProtectedRoute = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));

  return user && user.isLoggedIn ? (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;

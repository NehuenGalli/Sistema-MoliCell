import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/useAdminAuth';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

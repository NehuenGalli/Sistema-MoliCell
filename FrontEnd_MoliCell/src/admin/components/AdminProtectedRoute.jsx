import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/useAdminAuth';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAdminAuth();
  const location = useLocation();

  if (initializing) {
    return <div role="status" aria-live="polite">Validando sesión…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

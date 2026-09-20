import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loginAdmin } from '../services/adminApi';
import { authService } from '../../services/authService';
import AdminAuthContext from './AdminAuthContextStore';

export const AdminAuthProvider = ({ children }) => {
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(() => authService.obtenerUsuarioActual());
  const [sessionChecked, setSessionChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const shouldValidateSession = location.pathname.startsWith('/admin')
    && location.pathname !== '/admin/login'
    && !adminUser
    && !sessionChecked;
  const initializing = shouldValidateSession;

  useEffect(() => {
    if (!shouldValidateSession) return;

    let active = true;
    authService.obtenerSesion()
      .then((session) => {
        if (active) setAdminUser(session.usuario || null);
      })
      .catch(() => {
        if (active) setAdminUser(null);
      })
      .finally(() => {
        if (active) setSessionChecked(true);
      });
    return () => { active = false; };
  }, [shouldValidateSession]);

  // #14 Fix: usar try/finally para que loading siempre se resetee,
  // incluso si loginAdmin lanza una excepción no capturada
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginAdmin(email, password);

      if (res.success) {
        setAdminUser(res.usuario);
        return { success: true };
      }

      return { success: false, error: res.error || 'Credenciales no válidas' };
    } catch {
      return { success: false, error: 'Error de conexión. Verificá tu red e intentá de nuevo.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAuthenticated: Boolean(adminUser), login, logout, loading, initializing }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

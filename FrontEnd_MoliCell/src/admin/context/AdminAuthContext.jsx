import { useState } from 'react';
import { loginAdmin } from '../services/adminApi';
import AdminAuthContext from './AdminAuthContextStore';

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    const token = localStorage.getItem('molicell_admin_token');
    const userStr = localStorage.getItem('molicell_admin_user');
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        localStorage.removeItem('molicell_admin_user');
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // #14 Fix: usar try/finally para que loading siempre se resetee,
  // incluso si loginAdmin lanza una excepción no capturada
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginAdmin(email, password);

      if (res.success) {
        localStorage.setItem('molicell_admin_token', res.token);
        localStorage.setItem('molicell_admin_user', JSON.stringify(res.usuario));
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

  const logout = () => {
    localStorage.removeItem('molicell_admin_token');
    localStorage.removeItem('molicell_admin_user');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAuthenticated: Boolean(adminUser), login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

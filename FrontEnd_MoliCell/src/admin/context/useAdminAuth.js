import { useContext } from 'react';
import AdminAuthContext from './AdminAuthContextStore';

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth debe ser usado dentro de un AdminAuthProvider');
  }
  return context;
};

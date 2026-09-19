import apiClient from './apiClient';

const TOKEN_KEY = 'molicell_admin_token';
const USER_KEY = 'molicell_admin_user';

/**
 * Servicio para manejar Autenticación con JWT en el Backend
 */
export const authService = {
  /**
   * Iniciar sesión
   * POST /auth/login
   */
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const payload = res.data || res;
    if (payload.token) {
      localStorage.setItem(TOKEN_KEY, payload.token);
      if (payload.usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(payload.usuario));
      }
    }
    return payload;
  },

  /**
   * Cerrar sesión (limpia almacenamiento local)
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Obtener token JWT guardado
   */
  obtenerToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtener datos del usuario logueado
   */
  obtenerUsuarioActual: () => {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Verifica si hay una sesión activa
   */
  estaAutenticado: () => {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }
};

export default authService;

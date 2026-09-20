import apiClient from './apiClient';

const USER_KEY = 'molicell_admin_user';
const CSRF_KEY = 'molicell_csrf_token';

const guardarSesion = (payload) => {
  if (payload.csrfToken) sessionStorage.setItem(CSRF_KEY, payload.csrfToken);
  if (payload.usuario) sessionStorage.setItem(USER_KEY, JSON.stringify(payload.usuario));
};

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
    guardarSesion(payload);
    return payload;
  },

  obtenerSesion: async () => {
    const res = await apiClient.get('/auth/session');
    const payload = res.data || res;
    guardarSesion(payload);
    return payload;
  },

  /**
   * Cerrar sesión (limpia almacenamiento local)
   */
  logout: async () => {
    await apiClient.post('/auth/logout');
    sessionStorage.removeItem(CSRF_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  /**
   * Obtener token JWT guardado
   */
  obtenerUsuarioActual: () => {
    try {
      const user = sessionStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Verifica si hay una sesión activa
   */
  estaAutenticado: () => {
    return Boolean(sessionStorage.getItem(USER_KEY));
  }
};

export default authService;

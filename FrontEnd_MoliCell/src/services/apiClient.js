import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${hostname}:3000`;
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente la baseURL e el Token JWT si existe
apiClient.interceptors.request.use(
  (config) => {
    if (!import.meta.env.VITE_API_URL && typeof window !== 'undefined' && window.location.hostname) {
      config.baseURL = `http://${window.location.hostname}:3000`;
    }

    const token = localStorage.getItem('molicell_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si enviamos FormData, permitir que axios ajuste automáticamente el Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejo centralizado de errores
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('molicell_admin_token');
      localStorage.removeItem('molicell_admin_user');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }

    let message = 'Error de conexión con el servidor. Por favor, verificá tu conexión a internet o intenta de nuevo.';
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (typeof data.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data.details) && data.details.length > 0) {
        message = data.details[0].message || 'Fallo de validación de datos';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
export { API_BASE_URL };

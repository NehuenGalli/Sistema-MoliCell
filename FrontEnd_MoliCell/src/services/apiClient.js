import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return 'http://localhost:3000';
  if (import.meta.env.DEV) return `http://${window.location.hostname || 'localhost'}:3000`;
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

const getCache = new Map();
const stableParams = (params = {}) => JSON.stringify(
  Object.keys(params).sort().reduce((result, key) => ({ ...result, [key]: params[key] }), {})
);

export const invalidateGetCache = (prefix = '') => {
  for (const key of getCache.keys()) {
    if (!prefix || key.startsWith(prefix)) getCache.delete(key);
  }
};

export const cachedGet = (url, config = {}, ttlMs = 15000) => {
  const key = `${url}?${stableParams(config.params)}`;
  const now = Date.now();
  const cached = getCache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = apiClient.get(url, config).catch((error) => {
    getCache.delete(key);
    throw error;
  });
  getCache.set(key, { promise, expiresAt: now + ttlMs });
  return promise;
};

// Interceptor para inyectar automáticamente la baseURL e el Token JWT si existe
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('molicell_csrf_token')
      : null;
    const unsafeMethod = !['get', 'head', 'options'].includes(String(config.method || 'get').toLowerCase());
    if (csrfToken && unsafeMethod) {
      config.headers['X-CSRF-Token'] = csrfToken;
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
      sessionStorage.removeItem('molicell_csrf_token');
      sessionStorage.removeItem('molicell_admin_user');
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

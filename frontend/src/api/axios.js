import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login endpoints legitimately return 401 on a wrong password.
// Do NOT redirect/reload there, or the error message never reaches the form.
const AUTH_PATHS = ['/auth/login', '/auth/admin-login'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = AUTH_PATHS.some((p) => url.includes(p));
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT (if present) to every outgoing request automatically,
// so individual API calls never have to remember to set the header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saanvi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, the backend returns 401 — clear the
// session and bounce to login rather than leaving the user stuck on a
// broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saanvi_token');
      localStorage.removeItem('saanvi_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const normalizedBase = apiBase.replace(/\/+$/, '');
const baseURL = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;

export const shortUrlBase = normalizedBase.endsWith('/api')
  ? normalizedBase.slice(0, -4)
  : normalizedBase;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const registerUser = data => api.post('/auth/register', data);
export const loginUser = data => api.post('/auth/login', data);

// ============================================================
// URL
// ============================================================
export const shortenUrl = data => api.post('/shorten', data);
export const getUrlHistory = () => api.get('/urls');
export const deleteUrl = shortId => api.delete(`/urls/${shortId}`);

// ============================================================
// ANALYTICS
// ============================================================
export const getDashboardAnalytics = (days = 7) => api.get(`/analytics/dashboard?days=${days}`);
export const getUrlAnalytics = (shortId) => api.get(`/analytics/url/${shortId}`);
export const trackClick = (shortId) => api.get(`/analytics/track/${shortId}`);

export default api;
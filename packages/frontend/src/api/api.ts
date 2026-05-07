import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3131',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pitang_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pitang_token');
      localStorage.removeItem('pitang_user');
      // Evitar reload infinito 
      if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

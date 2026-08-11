// src/lib/api.js
import axios from 'axios';

export const api = axios.create({
  // Falls back to localhost if VITE_API_URL isn't set yet
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// Attach the JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Any 401 anywhere in the app → kick back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
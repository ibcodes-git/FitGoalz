import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.14:8000';

// Create the axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => {
    const formData = new URLSearchParams();
    formData.append('username', userData.username);
    formData.append('password', userData.password);
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  getProfile: (token) => api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Workouts API calls
export const workoutsAPI = {
  generate: (userData, token) => api.post('/workouts/generate', userData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};
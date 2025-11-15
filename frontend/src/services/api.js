import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.17:8000';

// Create the axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('userToken');
      // You can redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

// Token management functions
export const tokenService = {
  setToken: async (token) => {
    await AsyncStorage.setItem('userToken', token);
    // Also set it in axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  getToken: async () => {
    return await AsyncStorage.getItem('userToken');
  },

  removeToken: async () => {
    await AsyncStorage.removeItem('userToken');
    delete api.defaults.headers.common['Authorization'];
  },
};

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('api/auth/register', userData),

  login: async (userData) => {
    const formData = new URLSearchParams();
    formData.append('username', userData.email); // Changed from userData.username
    formData.append('password', userData.password);

    const response = await api.post('api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Auto-store token on successful login
    if (response.data.access_token) {
      await tokenService.setToken(response.data.access_token);
    }
    
    return response;
  },
    
  getProfile: () => api.get('api/auth/me'), // Token is auto-added by interceptor
  
  logout: async () => {
    await tokenService.removeToken();
  },
};

// Workouts API calls
export const workoutsAPI = {
  // Individual endpoints (for explicit choice)
  generateMLWorkout: () => api.post('/api/generate-ml-workout'),
  generateAIWorkout: () => api.post('/api/generate-ai-workout'),
  
  // Unified endpoint (for flexible/default behavior)
  generateWorkout: (useAI = false) => api.post('/api/generate-workout', { use_ai: useAI }),
  
  // Other endpoints
  getWorkouts: () => api.get('/api/plans'),
  compareWorkouts: () => api.post('/api/compare-workouts'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/api/fitness-profile'),
  updateProfile: (userData) => api.post('/api/fitness-profile', userData),
};

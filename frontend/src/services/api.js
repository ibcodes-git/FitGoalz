import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.20:8000';

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

// Workouts API calls - ML ONLY VERSION
export const workoutsAPI = {
  // Main workout generation endpoint
  generateWorkout: () => api.post('/api/generate-workout'),
  
  // Basic workout (fallback)
  generateBasicWorkout: () => api.post('/api/generate-basic'),
  
  // Get available workout plans
  getWorkoutPlans: () => api.get('/api/plans'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/api/fitness-profile'),
  updateProfile: (userData) => api.post('/api/fitness-profile', userData),
};

// Enhanced Feedback API calls
export const feedbackAPI = {
  // Enhanced: Log workout and get feedback in one call
  logWorkout: (workoutData) => api.post('/api/log-workout', workoutData),
  
  // Legacy endpoint (maintained)
  submitWorkoutFeedback: (feedbackData) => api.post('/api/workout-feedback', feedbackData),
  
  // Get enhanced workout history
  getMyWorkouts: () => api.get('/api/my-workouts'),
  
  // Get progress analytics
  getProgressAnalytics: () => api.get('/api/progress-analytics'),
  
  // Get detailed workout info
  getWorkoutDetails: (workoutId) => api.get(`/api/workout-details/${workoutId}`),

};
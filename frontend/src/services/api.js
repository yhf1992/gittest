import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xianxia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it and redirect to login
      localStorage.removeItem('xianxia_token');
      localStorage.removeItem('xianxia_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Register new user
  register: async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Login user
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get profile' };
    }
  },

  // Get cultivation levels
  getCultivationLevels: async () => {
    try {
      const response = await api.get('/auth/cultivation-levels');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get cultivation levels' };
    }
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('xianxia_token');
    localStorage.removeItem('xianxia_user');
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('xianxia_token');
    return !!token;
  },

  // Get stored user data
  getStoredUser: () => {
    const userStr = localStorage.getItem('xianxia_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Store user data
  storeUserData: (token, user) => {
    localStorage.setItem('xianxia_token', token);
    localStorage.setItem('xianxia_user', JSON.stringify(user));
  },
};

export const combatService = {
  // Get available monsters
  getMonsters: async () => {
    try {
      const response = await api.get('/monsters');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get monsters' };
    }
  },

  // Simulate combat
  simulateCombat: async (player, opponent, seed = null) => {
    try {
      const response = await api.post('/combat/simulate', {
        player,
        opponent,
        seed,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Combat simulation failed' };
    }
  },

  // Get character classes
  getCharacterClasses: async () => {
    try {
      const response = await api.get('/combat/character-classes');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get character classes' };
    }
  },

  // Get elements
  getElements: async () => {
    try {
      const response = await api.get('/combat/elements');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get elements' };
    }
  },
};

export default api;
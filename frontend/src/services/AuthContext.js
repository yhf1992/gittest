import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('xianxia_token');
        const storedUser = authService.getStoredUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          
          // Verify token is still valid by fetching profile
          try {
            const profileData = await authService.getProfile();
            setUser(profileData.user);
            authService.storeUserData(storedToken, profileData.user);
          } catch (error) {
            // Token invalid, clear storage
            authService.logout();
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      setToken(data.token);
      setUser(data.user);
      authService.storeUserData(data.token, data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await authService.register(username, email, password);
      setToken(data.token);
      setUser(data.user);
      authService.storeUserData(data.token, data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // In a real app, decode token or fetch user data
      setUser({ email: 'user@example.com', id: 1 });
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.access_token);
    setToken(response.access_token);
    setUser({ email, id: 1 });
    return response;
  };

  const register = async (email, password) => {
    return await authService.register(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    userId: 1 // In production, get from token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
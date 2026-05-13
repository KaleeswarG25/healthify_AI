// src/services/authService.js
import { authApi } from './api';

class AuthService {
  async register(email, password) {
    try {
      const response = await authApi.post('/register', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Registration failed';
    }
  }

  async login(email, password) {
    try {
      const response = await authApi.post('/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Invalid email or password';
    }
  }
}

export default new AuthService();
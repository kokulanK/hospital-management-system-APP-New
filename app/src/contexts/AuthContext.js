import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      // If pending, don't auto-login
      if (data.status === 'pending' && !data.token) {
        return { success: true, pending: true, message: data.message };
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
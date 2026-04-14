import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useToast } from './ToastContext';
import { useConfirm } from './ConfirmContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('Dashboard'); // For header title & sidebar active link
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      toast.showToast(`Welcome back, ${userData.username}!`, 'success');

      // Redirect based on role
      if (userData.role === 'staff') {
        navigate('/inventory');
        setCurrentRoute('Inventory Management');
      } else if (userData.role === 'cashier') {
        navigate('/pos');
        setCurrentRoute('Point of Sale');
      } else {
        navigate('/dashboard');
        setCurrentRoute('Dashboard');
      }
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.showToast(error.response?.data?.message || 'Invalid Credentials', 'error');
      return false;
    }
  };

  const logout = () => {
    confirm.showConfirm('Sign Out', 'Are you sure you want to sign out?', async () => {
      try {
        await api.post('/auth/logout'); // Log logout activity on server
      } catch (error) {
        console.warn('Logout log failed:', error);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        toast.showToast('Signed out successfully', 'info');
        navigate('/login');
        setCurrentRoute('');
      }
    });
  };

  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, currentRoute, setCurrentRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

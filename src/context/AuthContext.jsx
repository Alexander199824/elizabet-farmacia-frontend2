/**
 * @author Alexander Echeverria
 * @file AuthContext.jsx
 * @description Context de autenticación
 * @location /src/context/AuthContext.jsx
 */

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      toast.success('¡Bienvenido!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión');
      throw error;
    }
  };

  const loginWithGoogle = async (tokenId) => {
    try {
      const data = await authService.loginWithGoogle(tokenId);
      setUser(data.user);
      toast.success('¡Bienvenido!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      toast.success('¡Registro exitoso!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al registrarse');
      throw error;
    }
  };

  const registerWithGoogle = async (tokenId) => {
    try {
      const data = await authService.registerWithGoogle(tokenId);
      setUser(data.user);
      toast.success('¡Registro exitoso!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al registrarse con Google');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Sesión cerrada');
  };

  const updateUser = (updatedUserData) => {
    // Actualizar el estado del usuario
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);

    // Actualizar también en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    registerWithGoogle,
    logout,
    updateUser,
    isAuthenticated: authService.isAuthenticated(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
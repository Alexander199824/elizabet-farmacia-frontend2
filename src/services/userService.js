/**
 * @author Alexander Echeverria
 * @file userService.js
 * @description Servicio completo de usuarios
 * @location /src/services/userService.js
 */

import api from './api';

const userService = {
  // CREATE (ya está en authService, pero por completitud)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // READ ALL
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // READ ONE
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // UPDATE
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Activar/Desactivar
  toggleActive: async (id) => {
    try {
      const response = await api.patch(`/users/${id}/toggle-active`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Estadísticas
  getUserStats: async () => {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener perfil del usuario actual
  getMyProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      // Detectar si userData es FormData (para soportar imágenes)
      const isFormData = userData instanceof FormData;

      const response = await api.put('/users/profile', userData, {
        headers: isFormData ? {
          'Content-Type': 'multipart/form-data'
        } : undefined
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Buscar usuarios
  searchUsers: async (searchTerm) => {
    try {
      const response = await api.get('/users', {
        params: { search: searchTerm }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Filtrar por rol
  getUsersByRole: async (role) => {
    try {
      const response = await api.get('/users', {
        params: { role }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Subir imagen de perfil
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/users/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cambiar rol de usuario (método específico)
  changeUserRole: async (userId, newRole) => {
    try {
      // Validar que el rol sea válido
      const ROLES_VALIDOS = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];

      if (!ROLES_VALIDOS.includes(newRole)) {
        throw new Error(`Rol inválido. Roles válidos: ${ROLES_VALIDOS.join(', ')}`);
      }

      // Solo enviar el campo role como recomienda el backend
      const response = await api.put(`/users/${userId}`, {
        role: newRole
      });

      return response.data;
    } catch (error) {
      // Manejo de errores específico
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Error al cambiar rol';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
};

export default userService;
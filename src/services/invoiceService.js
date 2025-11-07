/**
 * @author Alexander Echeverria
 * @file invoiceService.js
 * @description Servicio de ventas/facturas
 * @location /src/services/invoiceService.js
 */

import api from './api';

const invoiceService = {
  // Crear venta
  createInvoice: async (invoiceData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener todas las ventas
  getAllInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener venta por ID
  getInvoiceById: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener próximo número de factura
  getNextInvoiceNumber: async () => {
    try {
      const response = await api.get('/invoices/next-number');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Anular venta
  cancelInvoice: async (id, reason) => {
    try {
      const response = await api.post(`/invoices/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Estadísticas de ventas
  getInvoiceStats: async (params = {}) => {
    try {
      const response = await api.get('/invoices/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============ ENDPOINTS PARA VENDEDORES ============

  /**
   * Obtener pedidos pendientes de preparar
   * Solo muestra pedidos con preparationStatus = 'pendiente' o 'en_preparacion'
   * @param {string|null} deliveryType - Filtrar por 'pickup' o 'delivery' (opcional)
   * @param {number} limit - Límite de resultados (opcional)
   * @returns {Promise<object>} Lista de pedidos pendientes
   */
  getPendingPreparation: async (deliveryType = null, limit = 50) => {
    try {
      let url = '/invoices/pending-preparation';
      const params = {};

      if (deliveryType) {
        params.deliveryType = deliveryType;
      }
      if (limit) {
        params.limit = limit;
      }

      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Marcar pedido como "en preparación"
   * Cambia preparationStatus de 'pendiente' a 'en_preparacion'
   * @param {number} invoiceId - ID del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  startPreparation: async (invoiceId) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/start-preparation`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Marcar pedido como "listo"
   * Cambia preparationStatus de 'en_preparacion' a 'listo'
   * @param {number} invoiceId - ID del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  markAsReady: async (invoiceId) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/mark-ready`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Marcar pedido como entregado (para pickup en tienda)
   * Solo para pedidos de tipo 'pickup'
   * @param {number} invoiceId - ID del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  markAsDeliveredPickup: async (invoiceId) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/mark-delivered`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============ ENDPOINTS PARA REPARTIDORES ============

  /**
   * Obtener pedidos listos para delivery
   * Solo muestra pedidos con deliveryType = 'delivery' y preparationStatus = 'listo' o 'en_camino'
   * @returns {Promise<object>} Lista de pedidos listos para entregar
   */
  getReadyForDelivery: async () => {
    try {
      const response = await api.get('/invoices/ready-for-delivery');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener pedidos asignados al repartidor autenticado
   * @returns {Promise<object>} Lista de pedidos asignados
   */
  getMyDeliveries: async () => {
    try {
      const response = await api.get('/invoices/my-deliveries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Tomar pedido para entregar
   * Asigna el pedido al repartidor y cambia estado a 'en_camino'
   * @param {number} invoiceId - ID del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  takeForDelivery: async (invoiceId) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/take-for-delivery`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Marcar pedido como entregado (para delivery)
   * Solo el repartidor asignado puede marcarlo
   * @param {number} invoiceId - ID del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  markAsDeliveredDelivery: async (invoiceId) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/mark-delivered`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============ ENDPOINTS ADICIONALES PARA GESTIÓN DE PEDIDOS ============

  /**
   * Obtener mis pedidos como cliente
   * @returns {Promise<object>} Lista de pedidos del cliente autenticado
   */
  getMyOrders: async () => {
    try {
      const response = await api.get('/invoices/my-orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Actualizar estado de un pedido (genérico)
   * Permite cambiar el estado de un pedido según los estados del backend
   * @param {number} orderId - ID del pedido
   * @param {string} status - Nuevo estado del pedido
   * @returns {Promise<object>} Pedido actualizado
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/invoices/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default invoiceService;
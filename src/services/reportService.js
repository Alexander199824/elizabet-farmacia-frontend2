/**
 * @author Alexander Echeverria
 * @file reportService.js
 * @description Servicio completo de reportes y analíticas - Actualizado para API de reportes backend
 * @location /src/services/reportService.js
 */

import api from './api';

const reportService = {
  // ==================== DASHBOARD ====================

  /**
   * Dashboard principal con métricas generales
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  getDashboard: async (period = 'month') => {
    try {
      const response = await api.get('/reports/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener dashboard:', error);
      throw error.response?.data || error.message;
    }
  },

  // ==================== REPORTES DE VENTAS ====================

  /**
   * Reporte de ventas con agrupación
   * @param {Object} params - { startDate, endDate, groupBy: 'product'|'category'|'client'|'day'|'month' }
   */
  getSalesReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de ventas:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Top productos más vendidos
   * @param {Object} params - { limit, startDate, endDate, sortBy: 'revenue'|'quantity' }
   */
  getTopProducts: async (params = {}) => {
    try {
      const response = await api.get('/reports/top-products', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener top productos:', error);
      throw error.response?.data || error.message;
    }
  },

  // ==================== REPORTES DE INVENTARIO ====================

  /**
   * Reporte de inventario
   * @param {Object} params - { stockStatus: 'low'|'out'|'normal'|'high' }
   */
  getInventoryReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de inventario:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Movimientos de inventario
   * @param {Object} params - { startDate, endDate, productId, type: 'entrada'|'salida'|'ajuste' }
   */
  getInventoryMovements: async (params = {}) => {
    try {
      const response = await api.get('/reports/inventory/movements', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Productos próximos a vencer
   * @param {number} days - Días hasta el vencimiento (default: 30)
   */
  getExpiringProducts: async (days = 30) => {
    try {
      const response = await api.get('/reports/inventory/expiring', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos a vencer:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Productos con stock bajo (mantener compatibilidad)
   */
  getLowStockReport: async () => {
    try {
      const response = await api.get('/reports/inventory', {
        params: { stockStatus: 'low' }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener stock bajo:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Reporte de vencimientos (mantener compatibilidad)
   */
  getExpirationReport: async (days = 30) => {
    return reportService.getExpiringProducts(days);
  },

  // ==================== REPORTES DE CLIENTES ====================

  /**
   * Análisis de clientes
   * @param {Object} params - { limit, sortBy: 'revenue'|'purchases'|'recent', startDate, endDate }
   */
  getClientsReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/clients', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de clientes:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Top clientes (mantener compatibilidad)
   */
  getTopClients: async (params = {}) => {
    return reportService.getClientsReport({ ...params, sortBy: 'revenue' });
  },

  // ==================== REPORTES DE DELIVERY ====================

  /**
   * Rendimiento de repartidores
   * @param {Object} params - { startDate, endDate, deliveryUserId }
   */
  getDeliveryPerformance: async (params = {}) => {
    try {
      const response = await api.get('/reports/delivery-performance', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener rendimiento de repartidores:', error);
      throw error.response?.data || error.message;
    }
  },

  // ==================== REPORTES FINANCIEROS ====================

  /**
   * Reporte financiero
   * @param {Object} params - { startDate, endDate }
   */
  getFinancialReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/financial', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte financiero:', error);
      throw error.response?.data || error.message;
    }
  },

  // ==================== MANTENER COMPATIBILIDAD CON CÓDIGO EXISTENTE ====================

  /**
   * Ventas por vendedor (mantener compatibilidad)
   */
  getSalesByVendor: async (startDate, endDate) => {
    try {
      const response = await api.get('/reports/sales', {
        params: { startDate, endDate, groupBy: 'vendor' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Ventas por categoría (mantener compatibilidad)
   */
  getSalesByCategory: async (startDate, endDate) => {
    try {
      const response = await api.get('/reports/sales', {
        params: { startDate, endDate, groupBy: 'category' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Análisis de clientes (mantener compatibilidad)
   */
  getClientAnalysis: async (startDate, endDate) => {
    try {
      const response = await api.get('/reports/clients', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Reporte de métodos de pago
   */
  getPaymentMethodsReport: async (startDate, endDate) => {
    try {
      const response = await api.get('/reports/financial', {
        params: { startDate, endDate }
      });
      // El reporte financiero incluye los métodos de pago
      return {
        methods: response.data.ingresosPorMetodo || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== EXPORTACIÓN ====================

  /**
   * Exportar reporte a PDF (mantener compatibilidad)
   */
  exportToPDF: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/reports/export/pdf/${reportType}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Exportar reporte a Excel (mantener compatibilidad)
   */
  exportToExcel: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/reports/export/excel/${reportType}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default reportService;
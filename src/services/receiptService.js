/**
 * @author Alexander Echeverria
 * @file receiptService.js
 * @description Servicio completo de recibos/comprobantes
 * @location /src/services/receiptService.js
 */

import api from './api';

const receiptService = {
  /**
   * Obtener todos los recibos de un cliente
   * @param {number} clientId - ID del cliente
   * @param {number} limit - Límite de recibos (default: 20)
   * @returns {Promise<object>} Lista de recibos del cliente
   */
  getClientReceipts: async (clientId, limit = 20) => {
    try {
      const response = await api.get(`/receipts/client/${clientId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener detalle de un recibo específico
   * @param {number} receiptId - ID del recibo
   * @returns {Promise<object>} Detalle completo del recibo
   */
  getReceiptById: async (receiptId) => {
    try {
      const response = await api.get(`/receipts/${receiptId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Generar PDF del recibo
   * @param {number} receiptId - ID del recibo
   * @returns {Promise<Blob>} Datos del PDF
   */
  generateReceiptPDF: async (receiptId) => {
    try {
      const response = await api.get(`/receipts/${receiptId}/pdf`, {
        responseType: 'blob' // Para descargar archivos
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Descargar PDF del recibo
   * @param {number} receiptId - ID del recibo
   * @param {string} filename - Nombre del archivo (opcional)
   */
  downloadReceiptPDF: async (receiptId, filename = null) => {
    try {
      const blob = await receiptService.generateReceiptPDF(receiptId);

      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Recibo-${receiptId}.pdf`;

      // Simular click y limpiar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Enviar recibo por email
   * @param {number} receiptId - ID del recibo
   * @returns {Promise<object>} Confirmación de envío
   */
  sendReceiptEmail: async (receiptId) => {
    try {
      const response = await api.post(`/receipts/${receiptId}/send-email`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener todos los recibos (admin)
   * @param {object} params - Parámetros de búsqueda y paginación
   * @returns {Promise<object>} Lista de recibos con paginación
   */
  getAllReceipts: async (params = {}) => {
    try {
      const response = await api.get('/receipts', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Crear un nuevo recibo
   * @param {object} receiptData - Datos del recibo
   * @returns {Promise<object>} Recibo creado
   */
  createReceipt: async (receiptData) => {
    try {
      const response = await api.post('/receipts', receiptData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Actualizar un recibo
   * @param {number} receiptId - ID del recibo
   * @param {object} receiptData - Datos a actualizar
   * @returns {Promise<object>} Recibo actualizado
   */
  updateReceipt: async (receiptId, receiptData) => {
    try {
      const response = await api.put(`/receipts/${receiptId}`, receiptData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cancelar un recibo
   * @param {number} receiptId - ID del recibo
   * @returns {Promise<object>} Confirmación de cancelación
   */
  cancelReceipt: async (receiptId) => {
    try {
      const response = await api.patch(`/receipts/${receiptId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Eliminar un recibo
   * @param {number} receiptId - ID del recibo
   * @returns {Promise<object>} Confirmación de eliminación
   */
  deleteReceipt: async (receiptId) => {
    try {
      const response = await api.delete(`/receipts/${receiptId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default receiptService;

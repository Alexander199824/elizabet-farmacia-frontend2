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
        responseType: 'blob', // Para descargar archivos
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Verificar si la respuesta es realmente un PDF o un error JSON
      if (response.data.type === 'application/json' || response.data.type.includes('json')) {
        // Si el backend devuelve JSON en lugar de PDF, es un error
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          // Mostrar el mensaje específico del backend
          throw new Error(errorData.message || errorData.error || 'Error al generar PDF');
        } catch (parseError) {
          // Si no se puede parsear, usar el texto tal cual
          throw new Error(text || 'Error al generar PDF');
        }
      }

      // Asegurarse de que el blob tenga el tipo correcto
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });

      // Validar que el blob no esté vacío
      if (pdfBlob.size === 0) {
        throw new Error('El PDF generado está vacío');
      }

      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);

      // Si el error ya es un Error que lanzamos, re-lanzarlo
      if (error.message && !error.response) {
        throw error;
      }

      // Si el error viene como blob del backend
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || errorData.error || 'Error al generar PDF');
        } catch (parseError) {
          throw new Error('El recibo no tiene todos los datos necesarios para generar el PDF. Por favor contacta al administrador.');
        }
      }

      // Error genérico
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Error al generar PDF';

      throw new Error(errorMessage);
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

      // Verificar que el blob sea válido
      if (!blob || blob.size === 0) {
        throw new Error('El PDF generado está vacío');
      }

      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Recibo-${receiptId}.pdf`;
      link.target = '_blank'; // Abrir en nueva pestaña como backup

      // Simular click y limpiar
      document.body.appendChild(link);
      link.click();

      // Esperar un poco antes de limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Ver PDF del recibo en nueva pestaña
   * @param {number} receiptId - ID del recibo
   */
  viewReceiptPDF: async (receiptId) => {
    try {
      const blob = await receiptService.generateReceiptPDF(receiptId);

      // Verificar que el blob sea válido
      if (!blob || blob.size === 0) {
        throw new Error('El PDF generado está vacío');
      }

      // Crear URL temporal para el blob y abrirlo en nueva pestaña
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      // Limpiar después de que se abra
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
      }

      return true;
    } catch (error) {
      console.error('Error viewing PDF:', error);
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
  },

  /**
   * Obtener recibo por invoiceId
   * @param {number} invoiceId - ID de la factura/pedido
   * @returns {Promise<object>} Recibo asociado a la factura
   */
  getReceiptByInvoiceId: async (invoiceId) => {
    try {
      const response = await api.get(`/receipts/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default receiptService;

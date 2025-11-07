/**
 * @author Alexander Echeverria
 * @file orderService.js
 * @description Servicio de pedidos online (nuevo sistema separado de invoices)
 * @location /src/services/orderService.js
 */

import api from './api';

const orderService = {
  // ========== PEDIDOS PARA CLIENTES (LOGUEADOS Y NO LOGUEADOS) ==========

  /**
   * Crear un nuevo pedido como INVITADO (sin autenticación)
   * @param {Object} orderData - Datos del pedido
   * @param {Object} orderData.guestInfo - Información del invitado
   * @param {string} orderData.guestInfo.firstName - Nombre
   * @param {string} orderData.guestInfo.lastName - Apellido
   * @param {string} orderData.guestInfo.email - Email
   * @param {string} orderData.guestInfo.phone - Teléfono (8 dígitos)
   * @param {string} orderData.guestInfo.address - Dirección
   * @param {Array} orderData.products - [{productId, quantity, unitPrice}]
   * @param {string} orderData.deliveryType - 'pickup' o 'delivery'
   * @param {string|null} orderData.shippingAddress - Dirección de envío (si delivery)
   * @param {string} orderData.paymentMethod - 'efectivo', 'tarjeta', 'transferencia'
   * @param {string} orderData.notes - Notas adicionales
   * @returns {Promise<Object>} Pedido creado
   */
  createGuestOrder: async (orderData) => {
    try {
      // Este endpoint NO requiere autenticación
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      console.log('🌐 Enviando a:', `${apiUrl}/orders/guest`);

      const response = await fetch(`${apiUrl}/orders/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // NO incluir Authorization header
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.message || data.error || 'Error al crear pedido');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en createGuestOrder:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo pedido como CLIENTE LOGUEADO
   * @param {Object} orderData - Datos del pedido
   * @param {Array} orderData.products - [{productId, quantity, unitPrice}]
   * @param {string} orderData.deliveryType - 'pickup' o 'delivery'
   * @param {string|null} orderData.shippingAddress - Dirección de envío (si delivery)
   * @param {string} orderData.paymentMethod - 'efectivo', 'tarjeta', 'transferencia'
   * @param {string} orderData.notes - Notas adicionales
   * @returns {Promise<Object>} Pedido creado
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Seguimiento de pedido SIN LOGIN (para invitados)
   * @param {string} orderNumber - Número de pedido (ej: ORD-202501-000001)
   * @param {string} email - Email usado en el pedido
   * @returns {Promise<Object>} Información del pedido
   */
  trackGuestOrder: async (orderNumber, email) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/orders/track?orderNumber=${orderNumber}&email=${email}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Pedido no encontrado');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener mis pedidos (cliente autenticado)
   * @returns {Promise<Object>} Lista de pedidos del cliente
   */
  getMyOrders: async () => {
    try {
      const response = await api.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener un pedido por ID (requiere autenticación)
   * @param {number} id - ID del pedido
   * @returns {Promise<Object>} Detalles completos del pedido
   */
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener historial/timeline de un pedido
   * @param {number} orderId - ID del pedido
   * @returns {Promise<Object>} Pedido con timeline de cambios
   */
  getOrderHistory: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/history`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cancelar un pedido (cliente, vendedor o admin)
   * @param {number} orderId - ID del pedido
   * @param {string} reason - Motivo de cancelación
   * @returns {Promise<Object>} Pedido cancelado
   */
  cancelOrder: async (orderId, reason) => {
    try {
      console.log(`❌ Cancelando pedido ${orderId}. Razón:`, reason);
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });
      console.log('✅ Pedido cancelado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al cancelar pedido:', error);
      throw error.response?.data || error.message;
    }
  },

  // ========== ENDPOINTS PARA VENDEDORES ==========

  /**
   * Obtener pedidos pendientes de gestión (Vendedor)
   * Estados: pendiente, confirmado, en_preparacion
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.deliveryType - 'pickup' o 'delivery'
   * @param {string} filters.priority - 'urgente', 'alta', 'normal'
   * @param {number} filters.limit - Límite de resultados
   * @returns {Promise<Object>} Lista de pedidos pendientes
   */
  getPendingOrders: async (filters = {}) => {
    try {
      const response = await api.get('/orders/pending', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener pedidos listos (listo_para_recoger, en_camino)
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Lista de pedidos listos
   */
  getReadyOrders: async (filters = {}) => {
    try {
      const response = await api.get('/orders/ready', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Actualizar el estado de un pedido (Vendedor)
   * @param {number} orderId - ID del pedido
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>} Pedido actualizado
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      console.log(`🔄 Actualizando estado del pedido ${orderId} a:`, status);
      console.log('📤 Request URL:', `/orders/${orderId}/status`);
      console.log('📦 Request body:', JSON.stringify({ status }, null, 2));

      const response = await api.put(`/orders/${orderId}/status`, { status });

      console.log('✅ Estado actualizado exitosamente');
      console.log('📥 Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ERROR COMPLETO al actualizar estado:');
      console.error('- Status HTTP:', error.response?.status);
      console.error('- Mensaje:', error.response?.data?.message || error.message);
      console.error('- Error completo:', error.response?.data || error.response || error);

      // Lanzar el error con el mensaje completo del backend
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error desconocido al actualizar estado';
      throw new Error(errorMessage);
    }
  },

  /**
   * Cambiar prioridad de un pedido (Vendedor)
   * @param {number} orderId - ID del pedido
   * @param {string} priority - 'urgente', 'alta', 'normal'
   * @returns {Promise<Object>} Pedido actualizado
   */
  updateOrderPriority: async (orderId, priority) => {
    try {
      const response = await api.put(`/orders/${orderId}/priority`, { priority });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========== ENDPOINTS PARA REPARTIDORES ==========

  /**
   * Obtener pedidos disponibles para entrega (Repartidor)
   * Solo muestra pedidos de tipo 'delivery' listos para enviar
   * @returns {Promise<Object>} Lista de pedidos disponibles
   */
  getAvailableDeliveries: async () => {
    try {
      const response = await api.get('/orders/deliveries/available');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener mis entregas (Repartidor)
   * Pedidos asignados al repartidor autenticado
   * @returns {Promise<Object>} Lista de pedidos asignados
   */
  getMyDeliveries: async () => {
    try {
      const response = await api.get('/orders/deliveries/my-deliveries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Asignar repartidor a un pedido (Vendedor o Repartidor)
   * @param {number} orderId - ID del pedido
   * @param {number} deliveryPersonId - ID del repartidor
   * @returns {Promise<Object>} Pedido actualizado
   */
  assignDeliveryPerson: async (orderId, deliveryPersonId) => {
    try {
      const response = await api.put(`/orders/${orderId}/assign-delivery`, {
        deliveryPersonId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========== ESTADÍSTICAS ==========

  /**
   * Obtener estadísticas de pedidos
   * @param {Object} params - Parámetros de filtrado (fechas, etc.)
   * @returns {Promise<Object>} Estadísticas
   */
  getOrderStats: async (params = {}) => {
    try {
      const response = await api.get('/orders/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener todos los pedidos con filtros (Admin/Vendedor)
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.page - Número de página
   * @param {number} params.limit - Límite de resultados
   * @param {string} params.status - Filtrar por estado
   * @param {string} params.deliveryType - Filtrar por tipo de entrega
   * @param {number} params.clientId - Filtrar por cliente
   * @returns {Promise<Object>} Lista de pedidos con paginación
   */
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========== ENDPOINTS PARA HISTORIAL DEL REPARTIDOR ==========

  /**
   * Obtener historial completo del repartidor
   * @param {Object} params - Parámetros de filtrado
   * @param {string} params.status - Filtrar por estado
   * @param {string} params.startDate - Fecha inicio
   * @param {string} params.endDate - Fecha fin
   * @param {string} params.search - Búsqueda por número o dirección
   * @param {number} params.page - Número de página
   * @param {number} params.limit - Límite de resultados
   * @returns {Promise<Object>} Historial de pedidos del repartidor
   */
  getDeliveryPersonHistory: async (params = {}) => {
    try {
      const response = await api.get('/orders/delivery-person/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener estadísticas del repartidor
   * @param {string} period - Periodo: 'today', 'week', 'month', 'all'
   * @returns {Promise<Object>} Estadísticas del repartidor
   */
  getDeliveryPersonStats: async (period = 'today') => {
    try {
      const response = await api.get('/orders/delivery-person/stats', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtener pedidos entregados hoy
   * @returns {Promise<Object>} Pedidos entregados hoy por el repartidor
   */
  getDeliveredToday: async () => {
    try {
      const response = await api.get('/orders/delivery-person/delivered-today');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default orderService;

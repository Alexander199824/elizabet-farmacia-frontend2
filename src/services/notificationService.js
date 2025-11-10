import api from './api';

/**
 * Servicio para gestionar notificaciones de usuarios
 */

// Tipos de notificaciones disponibles
export const NOTIFICATION_TYPES = {
  // Pedidos
  NUEVO_PEDIDO: 'nuevo_pedido',
  PEDIDO_CONFIRMADO: 'pedido_confirmado',
  PEDIDO_EN_PREPARACION: 'pedido_en_preparacion',
  PEDIDO_LISTO: 'pedido_listo',
  PEDIDO_EN_CAMINO: 'pedido_en_camino',
  PEDIDO_ENTREGADO: 'pedido_entregado',
  PEDIDO_COMPLETADO: 'pedido_completado',
  PEDIDO_CANCELADO: 'pedido_cancelado',
  PEDIDO_ASIGNADO: 'pedido_asignado',

  // Inventario
  STOCK_BAJO: 'stock_bajo',
  LOTE_VENCIMIENTO: 'lote_vencimiento',

  // Sistema
  ERROR: 'error',
  EXITO: 'exito',
  ADVERTENCIA: 'advertencia',
  INFO: 'info'
};

/**
 * Obtener todas las notificaciones del usuario actual
 */
export const getNotifications = async (limit = 50, onlyUnread = false) => {
  try {
    const params = { limit };
    if (onlyUnread) {
      params.onlyUnread = true;
    }
    const response = await api.get('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

/**
 * Obtener cantidad de notificaciones no leídas
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Error al obtener conteo de no leídas:', error);
    throw error;
  }
};

/**
 * Marcar una notificación como leída
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    throw error;
  }
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

/**
 * Crear una notificación (para uso interno del frontend)
 * Esto se usará para generar notificaciones locales hasta que el backend esté listo
 */
export const createLocalNotification = (notification) => {
  const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');

  const newNotification = {
    id: Date.now(),
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  existingNotifications.unshift(newNotification);

  // Mantener solo las últimas 100 notificaciones
  const updatedNotifications = existingNotifications.slice(0, 100);
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

  return newNotification;
};

/**
 * Obtener notificaciones locales (fallback mientras no haya backend)
 */
export const getLocalNotifications = () => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones locales:', error);
    return [];
  }
};

/**
 * Obtener conteo de notificaciones no leídas locales
 */
export const getLocalUnreadCount = () => {
  try {
    const notifications = getLocalNotifications();
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('Error al obtener conteo local:', error);
    return 0;
  }
};

/**
 * Marcar notificación local como leída
 */
export const markLocalAsRead = (notificationId) => {
  try {
    const notifications = getLocalNotifications();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    return false;
  }
};

/**
 * Marcar todas las notificaciones locales como leídas
 */
export const markAllLocalAsRead = () => {
  try {
    const notifications = getLocalNotifications();
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('notifications', JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    return false;
  }
};

/**
 * Eliminar notificación local
 */
export const deleteLocalNotification = (notificationId) => {
  try {
    const notifications = getLocalNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error al eliminar notificación local:', error);
    return false;
  }
};

/**
 * Limpiar todas las notificaciones locales
 */
export const clearLocalNotifications = () => {
  try {
    localStorage.removeItem('notifications');
    return true;
  } catch (error) {
    console.error('Error al limpiar notificaciones:', error);
    return false;
  }
};

// Función helper para generar mensajes según el tipo de notificación
export const getNotificationMessage = (type, data = {}) => {
  const messages = {
    [NOTIFICATION_TYPES.NUEVO_PEDIDO]: {
      title: '🛒 Nuevo Pedido',
      message: `Pedido #${data.orderId || ''} recibido de ${data.customerName || 'cliente'}`
    },
    [NOTIFICATION_TYPES.PEDIDO_CONFIRMADO]: {
      title: '✅ Pedido Confirmado',
      message: `Tu pedido #${data.orderId || ''} ha sido confirmado`
    },
    [NOTIFICATION_TYPES.PEDIDO_EN_PREPARACION]: {
      title: '📦 Pedido en Preparación',
      message: `Tu pedido #${data.orderId || ''} está siendo preparado`
    },
    [NOTIFICATION_TYPES.PEDIDO_LISTO]: {
      title: '✨ Pedido Listo',
      message: data.deliveryType === 'pickup'
        ? `Tu pedido #${data.orderId || ''} está listo para recoger`
        : `Pedido #${data.orderId || ''} listo para envío`
    },
    [NOTIFICATION_TYPES.PEDIDO_EN_CAMINO]: {
      title: '🚚 Pedido en Camino',
      message: `Tu pedido #${data.orderId || ''} está en camino`
    },
    [NOTIFICATION_TYPES.PEDIDO_ENTREGADO]: {
      title: '🎉 Pedido Entregado',
      message: `Tu pedido #${data.orderId || ''} ha sido entregado`
    },
    [NOTIFICATION_TYPES.PEDIDO_COMPLETADO]: {
      title: '✅ Pedido Completado',
      message: `Pedido #${data.orderId || ''} completado exitosamente`
    },
    [NOTIFICATION_TYPES.PEDIDO_CANCELADO]: {
      title: '❌ Pedido Cancelado',
      message: `El pedido #${data.orderId || ''} ha sido cancelado. ${data.reason || ''}`
    },
    [NOTIFICATION_TYPES.PEDIDO_ASIGNADO]: {
      title: '📍 Nuevo Pedido Asignado',
      message: `Se te ha asignado el pedido #${data.orderId || ''} para entrega`
    },
    [NOTIFICATION_TYPES.STOCK_BAJO]: {
      title: '⚠️ Stock Bajo',
      message: `${data.productName || 'Producto'} tiene stock bajo (${data.currentStock || 0} unidades)`
    },
    [NOTIFICATION_TYPES.LOTE_VENCIMIENTO]: {
      title: '⏰ Lote Próximo a Vencer',
      message: `Lote de ${data.productName || 'producto'} vence el ${data.expiryDate || ''}`
    },
    [NOTIFICATION_TYPES.ERROR]: {
      title: '❌ Error',
      message: data.message || 'Ha ocurrido un error'
    },
    [NOTIFICATION_TYPES.EXITO]: {
      title: '✅ Éxito',
      message: data.message || 'Operación completada exitosamente'
    },
    [NOTIFICATION_TYPES.ADVERTENCIA]: {
      title: '⚠️ Advertencia',
      message: data.message || 'Advertencia del sistema'
    },
    [NOTIFICATION_TYPES.INFO]: {
      title: 'ℹ️ Información',
      message: data.message || 'Información del sistema'
    }
  };

  return messages[type] || { title: 'Notificación', message: data.message || '' };
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createLocalNotification,
  getLocalNotifications,
  getLocalUnreadCount,
  markLocalAsRead,
  markAllLocalAsRead,
  deleteLocalNotification,
  clearLocalNotifications,
  getNotificationMessage,
  NOTIFICATION_TYPES
};

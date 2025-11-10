import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as markAsReadAPI,
  markAllAsRead as markAllAsReadAPI,
  deleteNotification as deleteNotificationAPI,
  getLocalNotifications,
  getLocalUnreadCount,
  markLocalAsRead,
  markAllLocalAsRead,
  deleteLocalNotification,
  createLocalNotification,
  NOTIFICATION_TYPES,
  getNotificationMessage
} from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(true); // Por defecto usar localStorage

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);

      if (useLocalStorage) {
        // Usar localStorage mientras el backend no esté listo
        const localNotifications = getLocalNotifications();
        const localUnreadCount = getLocalUnreadCount();

        setNotifications(localNotifications);
        setUnreadCount(localUnreadCount);
      } else {
        // Usar API del backend
        const notificationsData = await getNotifications(50);
        const unreadData = await getUnreadCount();

        setNotifications(notificationsData.notifications || []);
        setUnreadCount(unreadData.count || 0);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);

      // Fallback a localStorage si la API falla
      if (!useLocalStorage) {
        console.log('Fallback a localStorage');
        setUseLocalStorage(true);
        const localNotifications = getLocalNotifications();
        const localUnreadCount = getLocalUnreadCount();
        setNotifications(localNotifications);
        setUnreadCount(localUnreadCount);
      }
    } finally {
      setLoading(false);
    }
  }, [user, useLocalStorage]);

  // Cargar notificaciones al montar y cuando cambie el usuario
  useEffect(() => {
    loadNotifications();

    // Actualizar cada 30 segundos si hay un usuario autenticado
    if (user) {
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (useLocalStorage) {
        markLocalAsRead(notificationId);
      } else {
        await markAsReadAPI(notificationId);
      }

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  }, [useLocalStorage]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      if (useLocalStorage) {
        markAllLocalAsRead();
      } else {
        await markAllAsReadAPI();
      }

      // Actualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }, [useLocalStorage]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      if (useLocalStorage) {
        deleteLocalNotification(notificationId);
      } else {
        await deleteNotificationAPI(notificationId);
      }

      // Actualizar estado local
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }, [useLocalStorage]);

  // Agregar notificación (para uso interno)
  const addNotification = useCallback((type, data = {}) => {
    const { title, message } = getNotificationMessage(type, data);

    const notification = {
      type,
      title,
      message,
      relatedOrderId: data.orderId || null,
      relatedProductId: data.productId || null,
      data
    };

    if (useLocalStorage) {
      const newNotification = createLocalNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      return newNotification;
    } else {
      // Aquí se llamaría a la API para crear la notificación
      // Por ahora usar localStorage
      const newNotification = createLocalNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      return newNotification;
    }
  }, [useLocalStorage]);

  // Función helper para crear notificaciones de pedidos según el rol del usuario
  const notifyOrderChange = useCallback((order, oldStatus, newStatus) => {
    if (!user || !order) return;

    const userRole = user.rol;
    let shouldNotify = false;
    let notificationType = null;

    // Lógica de notificaciones según el rol
    switch (userRole) {
      case 'admin':
      case 'vendedor':
        // Notificar sobre nuevos pedidos y cancelaciones de clientes
        if (newStatus === 'pendiente') {
          notificationType = NOTIFICATION_TYPES.NUEVO_PEDIDO;
          shouldNotify = true;
        } else if (newStatus === 'cancelado' && order.clienteId) {
          notificationType = NOTIFICATION_TYPES.PEDIDO_CANCELADO;
          shouldNotify = true;
        }
        break;

      case 'repartidor':
        // Notificar sobre pedidos listos para envío o reasignaciones
        if (newStatus === 'listo_para_envio' && order.repartidorId === user.id) {
          notificationType = NOTIFICATION_TYPES.PEDIDO_LISTO;
          shouldNotify = true;
        } else if (order.repartidorId === user.id && oldStatus !== 'listo_para_envio') {
          notificationType = NOTIFICATION_TYPES.PEDIDO_ASIGNADO;
          shouldNotify = true;
        }
        break;

      case 'cliente':
        // Notificar sobre cambios en los pedidos del cliente
        if (order.clienteId === user.id) {
          const statusNotifications = {
            'confirmado': NOTIFICATION_TYPES.PEDIDO_CONFIRMADO,
            'en_preparacion': NOTIFICATION_TYPES.PEDIDO_EN_PREPARACION,
            'listo_para_recoger': NOTIFICATION_TYPES.PEDIDO_LISTO,
            'listo_para_envio': NOTIFICATION_TYPES.PEDIDO_LISTO,
            'en_camino': NOTIFICATION_TYPES.PEDIDO_EN_CAMINO,
            'entregado': NOTIFICATION_TYPES.PEDIDO_ENTREGADO,
            'completado': NOTIFICATION_TYPES.PEDIDO_COMPLETADO,
            'cancelado': NOTIFICATION_TYPES.PEDIDO_CANCELADO
          };

          notificationType = statusNotifications[newStatus];
          shouldNotify = notificationType !== undefined;
        }
        break;

      default:
        break;
    }

    if (shouldNotify && notificationType) {
      addNotification(notificationType, {
        orderId: order.id,
        customerName: order.clienteNombre || order.guestName || 'Cliente',
        deliveryType: order.tipoEntrega,
        reason: order.motivoCancelacion || ''
      });
    }
  }, [user, addNotification]);

  // Notificar sobre stock bajo (para bodega y admin)
  const notifyLowStock = useCallback((product) => {
    if (!user) return;

    if (user.rol === 'admin' || user.rol === 'bodega') {
      addNotification(NOTIFICATION_TYPES.STOCK_BAJO, {
        productId: product.id,
        productName: product.nombre,
        currentStock: product.cantidadDisponible
      });
    }
  }, [user, addNotification]);

  // Notificar sobre lotes próximos a vencer (para bodega y admin)
  const notifyExpiringBatch = useCallback((batch, product) => {
    if (!user) return;

    if (user.rol === 'admin' || user.rol === 'bodega') {
      addNotification(NOTIFICATION_TYPES.LOTE_VENCIMIENTO, {
        productId: product.id,
        productName: product.nombre,
        expiryDate: new Date(batch.fechaVencimiento).toLocaleDateString()
      });
    }
  }, [user, addNotification]);

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    notifyOrderChange,
    notifyLowStock,
    notifyExpiringBatch,
    NOTIFICATION_TYPES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

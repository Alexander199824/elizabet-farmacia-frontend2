/**
 * Hook personalizado para manejar notificaciones de pedidos
 * Se encarga de detectar cambios en pedidos y generar notificaciones automáticamente
 */

import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook que monitorea cambios en pedidos y genera notificaciones
 * @param {Array} orders - Lista de pedidos a monitorear
 */
export const useOrderNotifications = (orders = []) => {
  const { notifyOrderChange } = useNotifications();
  const { user } = useAuth();
  const previousOrdersRef = useRef({});

  useEffect(() => {
    if (!user || !orders || orders.length === 0) return;

    orders.forEach(order => {
      const previousOrder = previousOrdersRef.current[order.id];

      // Si es un pedido nuevo (no estaba en la lista anterior)
      if (!previousOrder) {
        // Solo notificar si el estado es 'pendiente' (pedido nuevo)
        if (order.estado === 'pendiente') {
          notifyOrderChange(order, null, order.estado);
        }
      } else {
        // Si cambió el estado del pedido
        if (previousOrder.estado !== order.estado) {
          notifyOrderChange(order, previousOrder.estado, order.estado);
        }

        // Si cambió el repartidor asignado
        if (previousOrder.repartidorId !== order.repartidorId && order.repartidorId) {
          notifyOrderChange(order, previousOrder.estado, order.estado);
        }
      }

      // Actualizar la referencia del pedido
      previousOrdersRef.current[order.id] = { ...order };
    });

    // Limpiar pedidos que ya no están en la lista
    const currentOrderIds = new Set(orders.map(o => o.id));
    Object.keys(previousOrdersRef.current).forEach(orderId => {
      if (!currentOrderIds.has(parseInt(orderId))) {
        delete previousOrdersRef.current[orderId];
      }
    });
  }, [orders, user, notifyOrderChange]);
};

/**
 * Hook para generar notificación cuando se crea un nuevo pedido
 * Usar esto cuando se cree un pedido exitosamente
 */
export const useNotifyNewOrder = () => {
  const { addNotification, NOTIFICATION_TYPES } = useNotifications();

  const notifyNewOrder = (order) => {
    addNotification(NOTIFICATION_TYPES.NUEVO_PEDIDO, {
      orderId: order.id || order.orderNumber,
      customerName: order.clienteNombre || order.guestName || 'Cliente'
    });
  };

  return { notifyNewOrder };
};

/**
 * Hook para generar notificaciones de stock bajo
 */
export const useNotifyLowStock = () => {
  const { notifyLowStock } = useNotifications();

  return { notifyLowStock };
};

/**
 * Hook para generar notificaciones de lotes próximos a vencer
 */
export const useNotifyExpiringBatch = () => {
  const { notifyExpiringBatch } = useNotifications();

  return { notifyExpiringBatch };
};

/**
 * Hook para agregar notificaciones manuales
 */
export const useAddNotification = () => {
  const { addNotification, NOTIFICATION_TYPES } = useNotifications();

  return { addNotification, NOTIFICATION_TYPES };
};

export default useOrderNotifications;

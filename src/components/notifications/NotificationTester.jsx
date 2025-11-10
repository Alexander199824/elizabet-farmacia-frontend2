/**
 * Componente de Prueba para el Sistema de Notificaciones
 *
 * Este componente permite generar notificaciones de prueba para cada tipo.
 * Es útil para desarrollo y testing.
 *
 * IMPORTANTE: Este componente es SOLO PARA DESARROLLO.
 * Elimínalo o desactívalo en producción.
 */

import React, { useState } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

const NotificationTester = () => {
  const { addNotification, NOTIFICATION_TYPES } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const testNotifications = [
    {
      type: NOTIFICATION_TYPES.NUEVO_PEDIDO,
      label: 'Nuevo Pedido',
      icon: '🛒',
      color: 'bg-primary-500',
      data: {
        orderId: Math.floor(Math.random() * 1000),
        customerName: 'Juan Pérez'
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_CONFIRMADO,
      label: 'Pedido Confirmado',
      icon: '✅',
      color: 'bg-success-500',
      data: {
        orderId: Math.floor(Math.random() * 1000)
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_EN_PREPARACION,
      label: 'Pedido en Preparación',
      icon: '📦',
      color: 'bg-info-500',
      data: {
        orderId: Math.floor(Math.random() * 1000)
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_LISTO,
      label: 'Pedido Listo',
      icon: '✨',
      color: 'bg-success-500',
      data: {
        orderId: Math.floor(Math.random() * 1000),
        deliveryType: 'pickup'
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_EN_CAMINO,
      label: 'Pedido en Camino',
      icon: '🚚',
      color: 'bg-info-500',
      data: {
        orderId: Math.floor(Math.random() * 1000)
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_ENTREGADO,
      label: 'Pedido Entregado',
      icon: '🎉',
      color: 'bg-success-500',
      data: {
        orderId: Math.floor(Math.random() * 1000)
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_CANCELADO,
      label: 'Pedido Cancelado',
      icon: '❌',
      color: 'bg-danger-500',
      data: {
        orderId: Math.floor(Math.random() * 1000),
        reason: 'Cancelado por el cliente'
      }
    },
    {
      type: NOTIFICATION_TYPES.PEDIDO_ASIGNADO,
      label: 'Pedido Asignado',
      icon: '📍',
      color: 'bg-primary-500',
      data: {
        orderId: Math.floor(Math.random() * 1000)
      }
    },
    {
      type: NOTIFICATION_TYPES.STOCK_BAJO,
      label: 'Stock Bajo',
      icon: '⚠️',
      color: 'bg-warning-500',
      data: {
        productId: Math.floor(Math.random() * 100),
        productName: 'Paracetamol 500mg',
        currentStock: 5
      }
    },
    {
      type: NOTIFICATION_TYPES.LOTE_VENCIMIENTO,
      label: 'Lote por Vencer',
      icon: '⏰',
      color: 'bg-warning-500',
      data: {
        productId: Math.floor(Math.random() * 100),
        productName: 'Ibuprofeno 400mg',
        expiryDate: '15/02/2025'
      }
    },
    {
      type: NOTIFICATION_TYPES.EXITO,
      label: 'Éxito',
      icon: '✅',
      color: 'bg-success-500',
      data: {
        message: '¡Operación completada exitosamente!'
      }
    },
    {
      type: NOTIFICATION_TYPES.ERROR,
      label: 'Error',
      icon: '❌',
      color: 'bg-danger-500',
      data: {
        message: 'Ha ocurrido un error en la operación'
      }
    },
    {
      type: NOTIFICATION_TYPES.ADVERTENCIA,
      label: 'Advertencia',
      icon: '⚠️',
      color: 'bg-warning-500',
      data: {
        message: 'Ten cuidado con esta acción'
      }
    },
    {
      type: NOTIFICATION_TYPES.INFO,
      label: 'Información',
      icon: 'ℹ️',
      color: 'bg-info-500',
      data: {
        message: 'Información importante del sistema'
      }
    }
  ];

  const handleTestNotification = (notification) => {
    addNotification(notification.type, notification.data);
  };

  const handleTestAll = () => {
    testNotifications.forEach((notification, index) => {
      setTimeout(() => {
        addNotification(notification.type, notification.data);
      }, index * 500); // Espaciar las notificaciones por 500ms
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Abrir panel de prueba de notificaciones"
      >
        <FiBell className="text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border border-neutral-200 w-96 max-h-[600px] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-primary-50">
        <div className="flex items-center gap-2">
          <FiBell className="text-primary-600 text-xl" />
          <h3 className="font-bold text-neutral-900">Test de Notificaciones</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-primary-100 rounded transition-colors"
        >
          <FiX className="text-neutral-600" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-info-50 border-b border-info-200">
        <p className="text-xs text-info-800">
          <strong>Modo de Desarrollo:</strong> Haz clic en cualquier botón para generar una notificación de prueba.
        </p>
      </div>

      {/* Botón para probar todas */}
      <div className="p-3 border-b border-neutral-200">
        <button
          onClick={handleTestAll}
          className="w-full py-2 px-4 bg-gradient-to-r from-primary-500 to-success-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-success-600 transition-all shadow-md"
        >
          🎉 Probar Todas las Notificaciones
        </button>
      </div>

      {/* Lista de notificaciones de prueba */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {testNotifications.map((notification, index) => (
            <button
              key={index}
              onClick={() => handleTestNotification(notification)}
              className={`w-full text-left p-3 rounded-lg border-2 hover:border-neutral-300 transition-all hover:shadow-md flex items-center gap-3 ${notification.color} bg-opacity-10 border-opacity-20`}
            >
              <span className="text-2xl">{notification.icon}</span>
              <span className="font-medium text-neutral-700 text-sm">
                {notification.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-xs text-neutral-500 text-center">
          ⚠️ Este componente es solo para desarrollo
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;

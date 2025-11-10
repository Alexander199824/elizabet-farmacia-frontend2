import React from 'react';
import { FiBell, FiCheck, FiTrash2, FiX } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de item individual de notificación
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }) => {
  const getNotificationIcon = (type) => {
    const iconMap = {
      'nuevo_pedido': '🛒',
      'pedido_confirmado': '✅',
      'pedido_en_preparacion': '📦',
      'pedido_listo': '✨',
      'pedido_en_camino': '🚚',
      'pedido_entregado': '🎉',
      'pedido_completado': '✅',
      'pedido_cancelado': '❌',
      'pedido_asignado': '📍',
      'stock_bajo': '⚠️',
      'lote_vencimiento': '⏰',
      'error': '❌',
      'exito': '✅',
      'advertencia': '⚠️',
      'info': 'ℹ️'
    };
    return iconMap[type] || 'ℹ️';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'nuevo_pedido': 'bg-primary-50 border-primary-200',
      'pedido_confirmado': 'bg-success-50 border-success-200',
      'pedido_en_preparacion': 'bg-info-50 border-info-200',
      'pedido_listo': 'bg-success-50 border-success-200',
      'pedido_en_camino': 'bg-info-50 border-info-200',
      'pedido_entregado': 'bg-success-50 border-success-200',
      'pedido_completado': 'bg-success-50 border-success-200',
      'pedido_cancelado': 'bg-danger-50 border-danger-200',
      'pedido_asignado': 'bg-primary-50 border-primary-200',
      'stock_bajo': 'bg-warning-50 border-warning-200',
      'lote_vencimiento': 'bg-warning-50 border-warning-200',
      'error': 'bg-danger-50 border-danger-200',
      'exito': 'bg-success-50 border-success-200',
      'advertencia': 'bg-warning-50 border-warning-200',
      'info': 'bg-info-50 border-info-200'
    };
    return colorMap[type] || 'bg-neutral-50 border-neutral-200';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div
      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
        !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
      } hover:bg-opacity-75 transition-all cursor-pointer relative group`}
      onClick={onClick}
    >
      {/* Indicador de no leída */}
      {!notification.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-primary-500 rounded-full" />
      )}

      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-neutral-900' : 'text-neutral-600'}`}>
              {notification.title}
            </h4>

            {/* Botones de acción */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Marcar como leída"
                >
                  <FiCheck className="text-sm text-success-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Eliminar"
              >
                <FiTrash2 className="text-sm text-danger-600" />
              </button>
            </div>
          </div>

          <p className={`text-sm mt-1 ${!notification.isRead ? 'text-neutral-700' : 'text-neutral-500'}`}>
            {notification.message}
          </p>

          <p className="text-xs text-neutral-400 mt-1">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Dropdown de notificaciones
 */
const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    // Marcar como leída
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navegar si hay un pedido relacionado
    if (notification.relatedOrderId) {
      // Cerrar el dropdown
      onClose();

      // Navegar según el tipo de notificación
      // Esto dependerá de la estructura de rutas de tu aplicación
      // navigate(`/pedidos/${notification.relatedOrderId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-neutral-200 z-50 max-h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div>
          <h3 className="font-semibold text-neutral-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {unreadCount} sin leer
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              title="Marcar todas como leídas"
            >
              <FiCheck className="inline mr-1" />
              Marcar todas
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Cerrar"
          >
            <FiX className="text-lg text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <FiBell className="text-4xl text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500 text-center">
              No tienes notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer (opcional) */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-neutral-200 text-center">
          <button
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

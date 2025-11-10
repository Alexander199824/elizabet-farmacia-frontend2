/**
 * @author Alexander Echeverria
 * @file CancelOrderModal.jsx
 * @description Modal para cancelar pedidos con selección de razón
 * @location /src/components/orders/CancelOrderModal.jsx
 */

import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const CancelOrderModal = ({ isOpen, onClose, order, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reasonOptions = [
    'Cliente no confirmó por teléfono',
    'Cliente no contestó llamadas',
    'Producto sin stock',
    'Cliente no estaba en domicilio',
    'Cliente rechazó el pedido',
    'Dirección incorrecta o inalcanzable',
    'Cliente pidió cancelar',
    'Otro'
  ];

  const handleConfirm = async () => {
    // Validar que haya una razón seleccionada
    const finalReason = reason === 'Otro' ? customReason : reason;

    if (!finalReason.trim()) {
      alert('Debes seleccionar o escribir una razón de cancelación');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(finalReason);
      handleClose();
    } catch (error) {
      console.error('Error al cancelar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen || !order) return null;

  // Obtener el nombre del cliente de forma robusta
  const clientName = order.client?.firstName && order.client?.lastName
    ? `${order.client.firstName} ${order.client.lastName}`
    : order.user?.firstName && order.user?.lastName
    ? `${order.user.firstName} ${order.user.lastName}`
    : 'Cliente';

  // Convertir total a número de forma segura
  const orderTotal = parseFloat(order.total) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="text-2xl text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Cancelar Pedido
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Información del pedido */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Pedido:</span>
              <span className="font-bold text-neutral-900">
                {order.orderNumber || order.invoiceNumber || `#${order.id}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Cliente:</span>
              <span className="font-medium text-neutral-900">
                {clientName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Total:</span>
              <span className="font-bold text-red-600">
                Q{orderTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Advertencia:</strong> Esta acción cancelará el pedido permanentemente.
              {order.status === 'en_preparacion' && ' Se liberará el inventario reservado.'}
            </p>
          </div>

          {/* Selector de razón */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Selecciona una razón de cancelación *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            >
              <option value="">-- Selecciona una razón --</option>
              {reasonOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de texto personalizado si selecciona "Otro" */}
          {reason === 'Otro' && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Especifica la razón *
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Escribe la razón específica de cancelación..."
                rows={3}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-neutral-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !reason || (reason === 'Otro' && !customReason.trim())}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Cancelando...</span>
              </>
            ) : (
              <>
                <FiAlertTriangle />
                <span>Confirmar Cancelación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;

/**
 * @author Alexander Echeverria
 * @file OrderTracking.jsx
 * @description Componente de seguimiento de pedidos con estados visuales
 * @location /src/components/orders/OrderTracking.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiCheckCircle,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiDownload,
  FiX
} from 'react-icons/fi';
import orderService from '../../services/orderService';
import receiptService from '../../services/receiptService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const OrderTracking = ({ orderId, onClose }) => {
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasReceipt, setHasReceipt] = useState(false);

  useEffect(() => {
    if (orderId) {
      cargarPedido();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarPedido, 30000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const cargarPedido = async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      setPedido(response.order);

      // Verificar si el pedido tiene recibo disponible
      if (response.order.status === 'entregado' || response.order.status === 'completado') {
        verificarRecibo(response.order.id);
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast.error('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const verificarRecibo = async (invoiceId) => {
    try {
      await receiptService.getReceiptByInvoiceId(invoiceId);
      setHasReceipt(true);
    } catch (error) {
      // Si no existe recibo, no pasa nada
      setHasReceipt(false);
    }
  };

  const descargarRecibo = async () => {
    try {
      toast.loading('Buscando recibo...', { id: 'download-receipt' });

      const receipt = await receiptService.getReceiptByInvoiceId(pedido.id);
      await receiptService.downloadReceiptPDF(receipt.id, `Recibo-${pedido.invoiceNumber}.pdf`);

      toast.success('Recibo descargado exitosamente', { id: 'download-receipt' });
    } catch (error) {
      console.error('Error al descargar recibo:', error);
      toast.error('Error al descargar recibo. El recibo aún no está disponible.', { id: 'download-receipt' });
    }
  };

  const obtenerMensajeEstado = (status, deliveryType) => {
    const mensajes = {
      'pendiente': {
        icon: FiClock,
        title: 'Pedido Recibido',
        message: 'Tu pedido está esperando confirmación de la farmacia',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'confirmado': {
        icon: FiCheckCircle,
        title: 'Pedido Confirmado',
        message: 'La farmacia ha aceptado tu pedido',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'en_preparacion': {
        icon: FiPackage,
        title: 'Preparando Pedido',
        message: 'Tu pedido está siendo preparado',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'listo_para_recoger': {
        icon: FiShoppingBag,
        title: 'Listo para Recoger',
        message: 'Tu pedido está listo. Puedes pasar a recogerlo',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'listo_para_envio': {
        icon: FiPackage,
        title: 'Listo para Envío',
        message: 'Tu pedido está listo y esperando a un repartidor',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'en_camino': {
        icon: FiTruck,
        title: 'En Camino',
        message: 'Tu pedido está en ruta de entrega',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      },
      'entregado': {
        icon: FiCheckCircle,
        title: 'Entregado',
        message: 'Tu pedido ha sido entregado exitosamente',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'completado': {
        icon: FiCheckCircle,
        title: 'Completado',
        message: 'Tu pedido ha sido completado exitosamente',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'cancelado': {
        icon: FiX,
        title: 'Cancelado',
        message: 'Este pedido ha sido cancelado',
        color: 'bg-red-100 text-red-800 border-red-200'
      },
      'anulado': {
        icon: FiX,
        title: 'Anulado',
        message: 'Este pedido ha sido anulado',
        color: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    return mensajes[status] || mensajes['pendiente'];
  };

  const puedeVerRecibo = (status) => {
    return (status === 'entregado' || status === 'completado') && hasReceipt;
  };

  // Componente auxiliar para items del timeline
  const EstadoItem = ({ icon: Icon, title, completado, activo }) => {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          completado ? 'bg-green-500 text-white' :
          activo ? 'bg-blue-500 text-white' :
          'bg-gray-200 text-gray-500'
        }`}>
          <Icon className="text-xl" />
        </div>
        <div>
          <p className={`font-semibold ${
            completado ? 'text-green-700' :
            activo ? 'text-blue-700' :
            'text-gray-500'
          }`}>
            {title}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500">Pedido no encontrado</p>
      </div>
    );
  }

  const estadoInfo = obtenerMensajeEstado(pedido.status, pedido.deliveryType);
  const StatusIcon = estadoInfo.icon;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header con botón cerrar */}
      {onClose && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-neutral-500" />
          </button>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Seguimiento de Pedido</h2>

      {/* Información del Pedido */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-600">Número de Pedido</p>
            <p className="text-xl font-bold text-primary-600">
              #{pedido.orderNumber || pedido.invoiceNumber || pedido.id || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(pedido.total)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Tipo de Entrega</p>
            <p className="font-semibold">
              {pedido.deliveryType === 'pickup' ? '🏪 Recoger en Tienda' : '🚚 Envío a Domicilio'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Fecha</p>
            <p className="font-semibold">
              {formatDate(pedido.createdAt || pedido.invoiceDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Estado Actual */}
      <div className={`${estadoInfo.color} rounded-lg p-6 mb-6 border`}>
        <div className="flex items-center gap-3 mb-2">
          <StatusIcon className="text-3xl" />
          <h3 className="text-xl font-bold">{estadoInfo.title}</h3>
        </div>
        <p className="text-sm">{estadoInfo.message}</p>
      </div>

      {/* Línea de Tiempo */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <h3 className="font-bold mb-4">Historial</h3>

        <div className="space-y-4">
          {/* Progreso visual según el tipo de entrega */}
          {pedido.deliveryType === 'pickup' ? (
            // Flujo para Recoger en Tienda
            <>
              <EstadoItem
                icon={FiClock}
                title="Pedido Recibido"
                completado={true}
                activo={pedido.status === 'pendiente'}
              />
              <EstadoItem
                icon={FiCheckCircle}
                title="Confirmado"
                completado={['confirmado', 'en_preparacion', 'listo_para_recoger', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'confirmado'}
              />
              <EstadoItem
                icon={FiPackage}
                title="En Preparación"
                completado={['en_preparacion', 'listo_para_recoger', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'en_preparacion'}
              />
              <EstadoItem
                icon={FiShoppingBag}
                title="Listo para Recoger"
                completado={['listo_para_recoger', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'listo_para_recoger'}
              />
              <EstadoItem
                icon={FiCheckCircle}
                title="Entregado"
                completado={pedido.status === 'entregado' || pedido.status === 'completado'}
                activo={pedido.status === 'entregado' || pedido.status === 'completado'}
              />
            </>
          ) : (
            // Flujo para Envío a Domicilio
            <>
              <EstadoItem
                icon={FiClock}
                title="Pedido Recibido"
                completado={true}
                activo={pedido.status === 'pendiente'}
              />
              <EstadoItem
                icon={FiCheckCircle}
                title="Confirmado"
                completado={['confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'confirmado'}
              />
              <EstadoItem
                icon={FiPackage}
                title="En Preparación"
                completado={['en_preparacion', 'listo_para_envio', 'en_camino', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'en_preparacion'}
              />
              <EstadoItem
                icon={FiPackage}
                title="Listo para Envío"
                completado={['listo_para_envio', 'en_camino', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'listo_para_envio'}
              />
              <EstadoItem
                icon={FiTruck}
                title="En Camino"
                completado={['en_camino', 'entregado', 'completado'].includes(pedido.status)}
                activo={pedido.status === 'en_camino'}
              />
              <EstadoItem
                icon={FiCheckCircle}
                title="Entregado"
                completado={pedido.status === 'entregado' || pedido.status === 'completado'}
                activo={pedido.status === 'entregado' || pedido.status === 'completado'}
              />
            </>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <h3 className="font-bold mb-4">Productos</h3>
        <div className="space-y-3">
          {pedido.items && pedido.items.length > 0 ? (
            pedido.items.map((item, idx) => {
              // Extraer nombre del producto de diferentes posibles ubicaciones
              const productName = item.product?.name || item.productName || item.Product?.name || 'Producto sin nombre';

              // Extraer precio unitario
              const unitPrice = parseFloat(item.unitPrice || item.price || item.Product?.price || 0);

              // Extraer cantidad
              const quantity = parseInt(item.quantity || 1);

              // Calcular total
              const total = item.total ? parseFloat(item.total) : (quantity * unitPrice);

              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">{productName}</p>
                    <p className="text-sm text-neutral-600">
                      Cantidad: {quantity} x {formatCurrency(unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold text-lg text-neutral-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-neutral-50 rounded-lg text-center">
              <p className="text-neutral-500">No hay productos en este pedido</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón Descargar Recibo (solo si está entregado) */}
      {puedeVerRecibo(pedido.status) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                <FiFileText className="text-xl" />
                Tu Recibo está Disponible
              </h3>
              <p className="text-sm text-green-700">
                Puedes descargar tu recibo en formato PDF
              </p>
            </div>
            <button
              onClick={descargarRecibo}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
            >
              <FiDownload className="text-xl" />
              Descargar Recibo
            </button>
          </div>
        </div>
      )}

      {/* Mensaje si el recibo aún no está disponible */}
      {(pedido.status === 'entregado' || pedido.status === 'completado') && !hasReceipt && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <FiClock className="text-2xl text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 mb-1">
                Recibo en Proceso
              </h3>
              <p className="text-sm text-yellow-700">
                Tu pedido ha sido entregado. El recibo se está generando y estará disponible en unos momentos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional para pedidos en proceso */}
      {!['entregado', 'completado', 'cancelado', 'anulado'].includes(pedido.status) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <FiFileText className="text-2xl text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800 mb-1">
                Información Importante
              </h3>
              <p className="text-sm text-blue-700">
                Tu recibo estará disponible para descargar una vez que el pedido sea entregado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

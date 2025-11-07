/**
 * @author Alexander Echeverria
 * @file MisPedidosPage.jsx
 * @description Página de pedidos del cliente
 * @location /src/pages/cliente/MisPedidosPage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiPackage, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiEye, FiRepeat, FiShoppingCart, FiFileText, FiDownload, FiShoppingBag } from 'react-icons/fi';
import orderService from '../../services/orderService';
import invoiceService from '../../services/invoiceService';
import receiptService from '../../services/receiptService';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import OrderTracking from '../../components/orders/OrderTracking';
import toast from 'react-hot-toast';

const MisPedidosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart, toggleCart } = useCart();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [repeatingOrder, setRepeatingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPedidos();
    }
  }, [user]);

  // Detectar si viene de una navegación con un orderId específico
  useEffect(() => {
    if (location.state?.openOrderId && pedidos.length > 0) {
      const order = pedidos.find(p => p.id === location.state.openOrderId);
      if (order) {
        handleViewDetails(order);
        // Limpiar el state para evitar que se abra de nuevo
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, pedidos]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      console.log('📦 Cargando pedidos del cliente...');

      // ========== CARGAR AMBOS: ORDERS (online) E INVOICES (local) ==========
      const [ordersResponse, invoicesResponse] = await Promise.all([
        orderService.getMyOrders().catch(err => {
          console.warn('Error al cargar orders:', err);
          return { orders: [] };
        }),
        invoiceService.getAllInvoices({ clientId: user.id }).catch(err => {
          console.warn('Error al cargar invoices:', err);
          return { invoices: [] };
        })
      ]);

      const onlineOrders = (ordersResponse.orders || []).map(order => ({
        ...order,
        type: 'order', // Marcar como pedido online
        orderNumber: order.orderNumber || `ORD-${order.id}`
      }));

      const localInvoices = (invoicesResponse.invoices || []).map(invoice => ({
        ...invoice,
        type: 'invoice', // Marcar como venta local
        orderNumber: invoice.invoiceNumber,
        // Mapear campos para consistencia
        createdAt: invoice.invoiceDate || invoice.createdAt
      }));

      // Combinar y ordenar por fecha (más recientes primero)
      const allPedidos = [...onlineOrders, ...localInvoices].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.invoiceDate);
        const dateB = new Date(b.createdAt || b.invoiceDate);
        return dateB - dateA;
      });

      console.log('✅ Pedidos cargados:', {
        ordersOnline: onlineOrders.length,
        invoicesLocal: localInvoices.length,
        total: allPedidos.length
      });

      setPedidos(allPedidos);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      pendiente: {
        label: 'Pendiente',
        color: 'warning',
        bgColor: 'bg-warning-100',
        textColor: 'text-warning-700',
        icon: FiClock,
      },
      confirmado: {
        label: 'Confirmado',
        color: 'primary',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: FiCheckCircle,
      },
      en_preparacion: {
        label: 'En Preparación',
        color: 'primary',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: FiPackage,
      },
      listo_para_recoger: {
        label: 'Listo para Recoger',
        color: 'success',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: FiPackage,
      },
      en_camino: {
        label: 'En Camino',
        color: 'primary',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-700',
        icon: FiTruck,
      },
      entregado: {
        label: 'Entregado',
        color: 'success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-700',
        icon: FiCheckCircle,
      },
      completado: {
        label: 'Completado',
        color: 'success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-700',
        icon: FiCheckCircle,
      },
      en_proceso: {
        label: 'En Proceso',
        color: 'primary',
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-700',
        icon: FiTruck,
      },
      completada: {
        label: 'Completada',
        color: 'success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-700',
        icon: FiCheckCircle,
      },
      cancelada: {
        label: 'Cancelada',
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-700',
        icon: FiXCircle,
      },
      anulada: {
        label: 'Anulada',
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-700',
        icon: FiXCircle,
      },
    };
    return statusMap[status] || statusMap.pendiente;
  };

  // Verificar si el pedido puede tener recibo
  const puedeVerRecibo = (status) => {
    return status === 'entregado' || status === 'completado';
  };

  // Descargar recibo de un pedido
  const handleDownloadRecibo = async (pedido) => {
    try {
      toast.loading('Buscando recibo...', { id: 'download-receipt' });

      console.log('🧾 Buscando recibo para pedido:', {
        id: pedido.id,
        type: pedido.type,
        orderNumber: pedido.orderNumber,
        invoiceId: pedido.invoiceId
      });

      // Usar el mismo método que MisRecibosPage para obtener todos los recibos con datos completos
      const response = await receiptService.getClientReceipts(user.id, 100);
      const allReceipts = response.receipts || [];

      console.log('📋 Total de recibos encontrados:', allReceipts.length);

      let receipt;

      if (pedido.type === 'order') {
        // Para pedidos online, buscar por invoiceId
        if (!pedido.invoiceId) {
          throw new Error('Este pedido aún no tiene factura asociada');
        }
        receipt = allReceipts.find(r => r.invoiceId === pedido.invoiceId);
      } else {
        // Para ventas locales (invoices), buscar por invoiceId
        receipt = allReceipts.find(r => r.invoiceId === pedido.id);
      }

      if (!receipt) {
        throw new Error('Recibo no encontrado. Es posible que aún no se haya generado.');
      }

      console.log('✅ Recibo encontrado:', {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        hasInvoice: !!receipt.invoice,
        hasItems: receipt.invoice?.items?.length || 0
      });

      // Validar que el recibo tenga los datos necesarios (igual que MisRecibosPage)
      if (!receipt.invoice || !receipt.invoice.items || receipt.invoice.items.length === 0) {
        throw new Error('Este recibo no tiene productos asociados y no puede generar PDF');
      }

      await receiptService.downloadReceiptPDF(receipt.id, `Recibo-${receipt.receiptNumber}.pdf`);

      toast.success('Recibo descargado exitosamente', { id: 'download-receipt' });
    } catch (error) {
      console.error('❌ Error al descargar recibo:', error);
      toast.error(
        error.message || 'El recibo aún no está disponible. Se generará cuando el pedido sea entregado.',
        { id: 'download-receipt' }
      );
    }
  };

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : filtroEstado === 'pendiente'
    ? pedidos.filter(p => ['pendiente', 'confirmado'].includes(p.status))
    : filtroEstado === 'en_proceso'
    ? pedidos.filter(p => ['en_preparacion', 'listo_para_recoger', 'en_camino'].includes(p.status))
    : filtroEstado === 'entregado'
    ? pedidos.filter(p => ['entregado', 'completado', 'completada'].includes(p.status))
    : pedidos.filter(p => p.status === filtroEstado);

  const handleViewDetails = async (pedido) => {
    try {
      console.log('🔍 Cargando detalles del pedido:', pedido.type, pedido.id);

      let details;

      if (pedido.type === 'order') {
        // Pedido online - usar orderService
        const response = await orderService.getOrderById(pedido.id);
        details = { ...response.order, type: 'order' };
      } else {
        // Venta local - usar invoiceService
        const response = await invoiceService.getInvoiceById(pedido.id);
        details = { ...response.invoice, type: 'invoice' };
      }

      setSelectedPedido(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching pedido details:', error);
      toast.error('Error al cargar los detalles del pedido');
    }
  };

  const handleRepeatOrder = async (pedido) => {
    if (repeatingOrder) return;

    setRepeatingOrder(true);
    const loadingToast = toast.loading('Verificando disponibilidad de productos...');

    try {
      // Obtener detalles completos del pedido según su tipo
      let pedidoData;

      if (pedido.type === 'order') {
        const details = await orderService.getOrderById(pedido.id);
        pedidoData = details.order;
      } else {
        const details = await invoiceService.getInvoiceById(pedido.id);
        pedidoData = details.invoice;
      }

      if (!pedidoData.items || pedidoData.items.length === 0) {
        toast.error('Este pedido no tiene productos', { id: loadingToast });
        return;
      }

      let addedCount = 0;
      let unavailableCount = 0;
      const unavailableProducts = [];

      // Verificar cada producto y su stock
      for (const item of pedidoData.items) {
        try {
          // Obtener información actualizada del producto
          const product = await productService.getProductById(item.product?.id || item.productId);

          // Verificar si el producto está activo y tiene stock
          if (product.isActive && product.stock > 0) {
            // Calcular cantidad a agregar (no más de lo que hay en stock)
            const quantityToAdd = Math.min(item.quantity, product.stock);

            // Agregar al carrito
            addToCart(product, quantityToAdd);
            addedCount++;

            // Informar si se agregó menos cantidad de la original
            if (quantityToAdd < item.quantity) {
              toast.warning(
                `${product.name}: Solo ${quantityToAdd} disponibles de ${item.quantity} solicitados`,
                { duration: 4000 }
              );
            }
          } else {
            unavailableCount++;
            unavailableProducts.push(item.product?.name || item.productName || 'Producto desconocido');
          }
        } catch (error) {
          console.error(`Error al obtener producto ${item.productId}:`, error);
          unavailableCount++;
          unavailableProducts.push(item.product?.name || item.productName || 'Producto desconocido');
        }
      }

      // Mostrar resultados
      if (addedCount > 0) {
        toast.success(
          `${addedCount} producto${addedCount > 1 ? 's agregados' : ' agregado'} al carrito`,
          { id: loadingToast, duration: 3000 }
        );

        if (unavailableCount > 0) {
          toast.error(
            `${unavailableCount} producto${unavailableCount > 1 ? 's no disponibles' : ' no disponible'}: ${unavailableProducts.join(', ')}`,
            { duration: 5000 }
          );
        }

        // Abrir el carrito para que el usuario vea los productos agregados
        setTimeout(() => toggleCart(), 500);
      } else {
        toast.error(
          'Ningún producto del pedido está disponible actualmente',
          { id: loadingToast, duration: 4000 }
        );
      }

    } catch (error) {
      console.error('Error al repetir pedido:', error);
      toast.error('Error al procesar el pedido', { id: loadingToast });
    } finally {
      setRepeatingOrder(false);
    }
  };

  const handleNewOrder = () => {
    navigate('/dashboard/compras');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">Mis Pedidos</h1>
          <p className="text-neutral-600 mt-2">
            Seguimiento de tus pedidos y compras
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewOrder}
            className="btn-primary flex items-center space-x-2"
          >
            <FiShoppingCart />
            <span>Nuevo Pedido</span>
          </button>
          <div className="flex items-center space-x-2">
            <FiPackage className="text-2xl text-primary-600" />
            <span className="text-lg font-semibold">{pedidosFiltrados.length} pedidos</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'todos'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">{pedidos.length}</p>
          <p className="text-sm">Todos</p>
        </button>
        <button
          onClick={() => setFiltroEstado('pendiente')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'pendiente'
              ? 'bg-warning-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">
            {pedidos.filter(p => ['pendiente', 'confirmado'].includes(p.status)).length}
          </p>
          <p className="text-sm">Pendientes</p>
        </button>
        <button
          onClick={() => setFiltroEstado('en_proceso')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'en_proceso'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">
            {pedidos.filter(p => ['en_preparacion', 'listo_para_recoger', 'en_camino'].includes(p.status)).length}
          </p>
          <p className="text-sm">En Proceso</p>
        </button>
        <button
          onClick={() => setFiltroEstado('entregado')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'entregado'
              ? 'bg-success-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">
            {pedidos.filter(p => ['entregado', 'completado', 'completada'].includes(p.status)).length}
          </p>
          <p className="text-sm">Entregados</p>
        </button>
        <button
          onClick={() => setFiltroEstado('cancelada')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'cancelada'
              ? 'bg-danger-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">
            {pedidos.filter(p => p.status === 'cancelada' || p.status === 'anulada').length}
          </p>
          <p className="text-sm">Canceladas</p>
        </button>
      </div>

      {/* Pedidos List */}
      <div className="space-y-4">
        {pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map((pedido) => {
            const statusConfig = getStatusConfig(pedido.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-12 h-12 ${statusConfig.bgColor} rounded-lg flex items-center justify-center`}>
                        <StatusIcon className={`text-2xl ${statusConfig.textColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-neutral-900">
                            Pedido {pedido.orderNumber || pedido.invoiceNumber}
                          </h3>
                          {/* Badge para distinguir tipo */}
                          {pedido.type === 'order' ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center space-x-1">
                              <FiShoppingCart className="text-xs" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center space-x-1">
                              <FiShoppingBag className="text-xs" />
                              <span>Tienda</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          {formatDate(pedido.createdAt || pedido.invoiceDate)}
                        </p>
                      </div>
                      <span className={`badge badge-${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Productos</p>
                        <p className="font-semibold">{pedido.items?.length || 0} artículos</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Total</p>
                        <p className="font-bold text-success-600 text-lg">
                          {formatCurrency(pedido.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Método de Pago</p>
                        <p className="font-semibold capitalize">
                          {pedido.paymentMethod || 'Efectivo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(pedido)}
                      className="btn-outline flex items-center justify-center space-x-2"
                    >
                      <FiEye />
                      <span>Ver Detalles</span>
                    </button>
                    {puedeVerRecibo(pedido.status) && (
                      <button
                        onClick={() => handleDownloadRecibo(pedido)}
                        className="btn-success flex items-center justify-center space-x-2"
                      >
                        <FiDownload />
                        <span>Recibo</span>
                      </button>
                    )}
                    {(pedido.status === 'completada' || pedido.status === 'completado' || pedido.status === 'entregado') && (
                      <button
                        onClick={() => handleRepeatOrder(pedido)}
                        disabled={repeatingOrder}
                        className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiRepeat />
                        <span>{repeatingOrder ? 'Procesando...' : 'Repetir Pedido'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <FiPackage className="text-6xl text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
              {filtroEstado === 'todos' ? 'No tienes pedidos' : `No hay pedidos ${filtroEstado}`}
            </h3>
            <p className="text-neutral-500">
              Tus pedidos aparecerán aquí una vez que realices una compra
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalles con OrderTracking */}
      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Mostrar OrderTracking solo para pedidos online */}
            {selectedPedido.type === 'order' ? (
              <OrderTracking
                orderId={selectedPedido.id}
                onClose={() => setShowModal(false)}
              />
            ) : (
              // Para ventas locales (invoices), mostrar detalles simples
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Detalles de Compra</h2>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full flex items-center space-x-1">
                        <FiShoppingBag />
                        <span>Compra en Tienda</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <FiXCircle className="text-2xl text-neutral-500" />
                  </button>
                </div>

                {/* Info del pedido */}
                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">Número de Factura</p>
                      <p className="text-xl font-bold text-primary-600">{selectedPedido.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Fecha</p>
                      <p className="font-semibold">{formatDate(selectedPedido.invoiceDate || selectedPedido.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Estado</p>
                      <span className={`badge badge-${getStatusConfig(selectedPedido.status).color}`}>
                        {getStatusConfig(selectedPedido.status).label}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Total</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPedido.total)}</p>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="mb-6">
                  <h3 className="font-bold mb-4">Productos Comprados</h3>
                  <div className="space-y-3">
                    {(selectedPedido.items || []).map((item, idx) => {
                      const productName = item.product?.name || item.productName || item.Product?.name || 'Producto';
                      const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                      const quantity = parseInt(item.quantity || 1);
                      const total = item.total ? parseFloat(item.total) : (quantity * unitPrice);

                      return (
                        <div key={item.id || idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
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
                    })}
                  </div>
                </div>

                {/* Mensaje de recibo */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 flex items-center space-x-2">
                    <FiCheckCircle />
                    <span>Esta compra fue realizada en tienda y ya fue completada.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Body adicional con botón repetir pedido */}
            <div className="px-6 pb-6 space-y-6">
              {/* Botón Repetir Pedido en Modal */}
              {(selectedPedido.status === 'completada' || selectedPedido.status === 'completado' || selectedPedido.status === 'entregado') && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => {
                      handleRepeatOrder(selectedPedido);
                      setShowModal(false);
                    }}
                    disabled={repeatingOrder}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiRepeat className="text-xl" />
                    <span>{repeatingOrder ? 'Procesando...' : 'Repetir este Pedido'}</span>
                  </button>
                  <p className="text-xs text-neutral-500 text-center mt-2">
                    Se agregarán al carrito los productos disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPedidosPage;

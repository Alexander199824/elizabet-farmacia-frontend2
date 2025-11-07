/**
 * @author Alexander Echeverria
 * @file PedidosOnlinePage.jsx
 * @description Panel para vendedores - Gestión de pedidos online
 * @location /src/pages/vendedor/PedidosOnlinePage.jsx
 */

import { useState, useEffect } from 'react';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiShoppingBag,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiCornerUpLeft,
  FiX,
  FiGift,
  FiDownload
} from 'react-icons/fi';
import orderService from '../../services/orderService';
import receiptService from '../../services/receiptService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import CancelOrderModal from '../../components/orders/CancelOrderModal';

const PedidosOnlinePage = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pickup', 'delivery'
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos', 'completados', 'todos'
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, listos: 0, completados: 0 });

  // Estado para el modal de cancelación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pedidoToCancel, setPedidoToCancel] = useState(null);

  useEffect(() => {
    cargarPedidos();

    // Actualizar cada 5 minutos (300000 ms) para no interrumpir el trabajo
    // Solo actualizar automáticamente si NO estamos viendo completados (para no molestar)
    if (filtroEstado !== 'completados') {
      const interval = setInterval(cargarPedidos, 300000);
      return () => clearInterval(interval);
    }
  }, [filtro, filtroEstado]);

  const cargarPedidos = async () => {
    setLoading(true);

    try {
      const filters = {};
      if (filtro !== 'todos') {
        filters.deliveryType = filtro; // 'pickup' o 'delivery'
      }

      let todosPedidos = [];
      let completadosCount = 0;

      // Según el filtro de estado, cargar diferentes pedidos
      if (filtroEstado === 'activos') {
        // Obtener pedidos pendientes (pendiente, confirmado, en_preparacion)
        const pendingResponse = await orderService.getPendingOrders(filters);
        console.log('✅ Respuesta getPendingOrders:', pendingResponse);

        // Obtener pedidos listos (listo_para_recoger, listo_para_envio, en_camino)
        const readyResponse = await orderService.getReadyOrders(filters);
        console.log('✅ Respuesta getReadyOrders:', readyResponse);

        // Combinar ambos arrays
        const pedidosPendientes = pendingResponse.orders || [];
        const pedidosListos = readyResponse.orders || [];
        todosPedidos = [...pedidosPendientes, ...pedidosListos];

      } else if (filtroEstado === 'completados') {
        // Obtener pedidos completados/entregados
        const completedFilters = {
          ...filters,
          status: 'entregado,completado', // Buscar ambos estados
          limit: 50 // Limitar a los últimos 50
        };
        const completedResponse = await orderService.getAllOrders(completedFilters);
        console.log('✅ Respuesta pedidos completados:', completedResponse);

        todosPedidos = completedResponse.orders || [];
        completadosCount = todosPedidos.length;

      } else {
        // 'todos' - Cargar activos + completados
        const pendingResponse = await orderService.getPendingOrders(filters);
        const readyResponse = await orderService.getReadyOrders(filters);
        const completedResponse = await orderService.getAllOrders({
          ...filters,
          status: 'entregado,completado',
          limit: 50
        });

        const pedidosPendientes = pendingResponse.orders || [];
        const pedidosListos = readyResponse.orders || [];
        const pedidosCompletados = completedResponse.orders || [];

        todosPedidos = [...pedidosPendientes, ...pedidosListos, ...pedidosCompletados];
        completadosCount = pedidosCompletados.length;
      }

      setPedidos(todosPedidos);

      // Debug: Mostrar información de todos los pedidos
      console.log('📋 Pedidos cargados:', todosPedidos.map(p => ({
        id: p.id,
        orderNumber: p.orderNumber,
        status: p.status,
        deliveryType: p.deliveryType,
        priority: p.priority,
        total: p.total
      })));

      // Calcular estadísticas
      setStats({
        total: todosPedidos.length,
        pending: todosPedidos.filter(p => p.status === 'pendiente').length,
        inProgress: todosPedidos.filter(p => p.status === 'en_preparacion').length,
        listos: todosPedidos.filter(p => ['listo_para_recoger', 'listo_para_envio', 'en_camino'].includes(p.status)).length,
        completados: filtroEstado === 'completados' ? completadosCount : todosPedidos.filter(p => ['entregado', 'completado'].includes(p.status)).length
      });

    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      toast.error('Error al cargar pedidos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Función para confirmar pedido después de llamar al cliente
  const confirmarPedido = async (orderId) => {
    // Buscar el pedido actual
    const pedidoActual = pedidos.find(p => p.id === orderId);

    if (!pedidoActual) {
      toast.error('Pedido no encontrado');
      return;
    }

    // Mostrar confirmación
    const confirmed = window.confirm(
      `📞 ¿Ya llamaste al cliente?\n\n` +
      `Cliente: ${pedidoActual.client?.firstName} ${pedidoActual.client?.lastName}\n` +
      `¿Confirmó que desea este pedido?`
    );

    if (!confirmed) return;

    try {
      await orderService.updateOrderStatus(orderId, 'confirmado');
      toast.success('✅ Pedido confirmado. Ya puedes comenzar a prepararlo');
      cargarPedidos();
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      toast.error(error.message || 'Error al confirmar pedido');
    }
  };

  // Función para comenzar preparación (solo si está confirmado)
  const comenzarPreparacion = async (orderId) => {
    try {
      console.log('🎯 Iniciando preparación del pedido:', orderId);

      // Buscar el pedido actual para verificar su estado
      const pedidoActual = pedidos.find(p => p.id === orderId);

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado');
      }

      console.log('📋 Estado actual del pedido:', pedidoActual.status);

      // Si el pedido está 'pendiente', primero confirmarlo
      if (pedidoActual.status === 'pendiente') {
        console.log('⏩ Pedido pendiente, confirmando primero...');
        await orderService.updateOrderStatus(orderId, 'confirmado');
        console.log('✅ Pedido confirmado');

        // Pequeña pausa para asegurar que el backend procese
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Ahora cambiar estado a 'en_preparacion'
      console.log('⏩ Cambiando a en_preparacion...');
      await orderService.updateOrderStatus(orderId, 'en_preparacion');

      console.log('✅ Pedido actualizado exitosamente');
      toast.success('Pedido tomado para preparar');
      cargarPedidos();
    } catch (error) {
      console.error('❌ Error en comenzarPreparacion:', error);
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Error.message:', error.message);

      // Mostrar el mensaje de error completo
      toast.error(error.message || 'Error al tomar pedido');
    }
  };

  // Función para abrir modal de cancelación
  const openCancelModal = (pedido) => {
    setPedidoToCancel(pedido);
    setCancelModalOpen(true);
  };

  // Función para confirmar cancelación
  const handleCancelOrder = async (reason) => {
    try {
      await orderService.cancelOrder(pedidoToCancel.id, reason);
      toast.success('❌ Pedido cancelado correctamente');
      cargarPedidos();
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error(error.message || 'Error al cancelar pedido');
      throw error; // Para que el modal pueda manejar el error
    }
  };

  const marcarListo = async (orderId) => {
    try {
      console.log('🎯 Marcando pedido como listo:', orderId);

      // Buscar el pedido actual
      const pedidoActual = pedidos.find(p => p.id === orderId);

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado');
      }

      console.log('📋 Tipo de entrega:', pedidoActual.deliveryType);

      // Determinar el estado según el tipo de entrega
      // - pickup: listo_para_recoger (cliente recoge en farmacia)
      // - delivery: listo_para_envio (esperando repartidor)
      if (pedidoActual.deliveryType === 'pickup') {
        await orderService.updateOrderStatus(orderId, 'listo_para_recoger');
        toast.success('✅ Pedido listo para recoger en tienda');
      } else if (pedidoActual.deliveryType === 'delivery') {
        // Para delivery, cambiar a 'listo_para_envio' (el repartidor lo tomará)
        await orderService.updateOrderStatus(orderId, 'listo_para_envio');
        toast.success('🎁 Pedido listo para que el repartidor lo recoja');
      }

      cargarPedidos();
    } catch (error) {
      console.error('❌ Error al marcar como listo:', error);
      toast.error(error.message || 'Error al marcar como listo');
    }
  };

  const marcarEntregado = async (orderId) => {
    if (!confirm('¿Confirmar que el cliente recogió el pedido?')) return;

    try {
      // Cambiar estado a 'entregado'
      await orderService.updateOrderStatus(orderId, 'entregado');
      toast.success('✅ Pedido entregado.');
      cargarPedidos();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al marcar como entregado');
    }
  };

  // Función para descargar el recibo en PDF
  const descargarRecibo = async (receiptId, receiptNumber) => {
    if (!receiptId) {
      toast.error('Este pedido no tiene un recibo asociado');
      return;
    }

    try {
      toast.loading('Generando PDF...', { id: 'download-receipt' });

      // Obtener el recibo completo con todos sus datos
      const receipt = await receiptService.getReceiptById(receiptId);

      // Validar que el recibo tenga los datos necesarios
      if (!receipt.invoice || !receipt.invoice.items || receipt.invoice.items.length === 0) {
        throw new Error('Este recibo no tiene productos asociados y no puede generar PDF');
      }

      await receiptService.downloadReceiptPDF(receiptId, `Recibo-${receiptNumber}.pdf`);

      toast.success('Recibo descargado exitosamente', { id: 'download-receipt' });
    } catch (error) {
      console.error('❌ Error al descargar recibo:', error);
      toast.error(error.message || 'Error al descargar el recibo', { id: 'download-receipt' });
    }
  };

  // Nueva función: Retroceder estado (Deshacer)
  const retrocederEstado = async (orderId) => {
    try {
      console.log('🔄 Retrocediendo estado del pedido:', orderId);

      // Buscar el pedido actual
      const pedidoActual = pedidos.find(p => p.id === orderId);

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado');
      }

      // Determinar el estado anterior según el estado actual
      const estadosRetroceso = {
        'confirmado': 'pendiente',
        'en_preparacion': 'confirmado',
        'listo_para_recoger': 'en_preparacion',
        'en_camino': 'en_preparacion'
      };

      const nuevoEstado = estadosRetroceso[pedidoActual.status];

      if (!nuevoEstado) {
        toast.error('No se puede retroceder desde este estado');
        return;
      }

      // Confirmar la acción
      if (!confirm(`¿Deshacer y volver al estado "${nuevoEstado}"?`)) {
        return;
      }

      console.log(`⬅️ Retrocediendo de "${pedidoActual.status}" a "${nuevoEstado}"`);

      await orderService.updateOrderStatus(orderId, nuevoEstado);
      toast.success(`Estado revertido a: ${nuevoEstado}`);
      cargarPedidos();

    } catch (error) {
      console.error('❌ Error al retroceder estado:', error);
      toast.error(error.message || 'Error al retroceder estado');
    }
  };

  const getPreparationStatusBadge = (status) => {
    const badges = {
      pendiente: { color: 'warning', label: 'Pendiente', icon: FiClock },
      confirmado: { color: 'primary', label: 'Confirmado', icon: FiCheckCircle },
      en_preparacion: { color: 'primary', label: 'En Preparación', icon: FiPackage },
      listo: { color: 'success', label: 'Listo', icon: FiCheckCircle },
      listo_para_recoger: { color: 'success', label: 'Listo para Recoger', icon: FiShoppingBag },
      listo_para_envio: { color: 'success', label: 'Listo para Envío', icon: FiGift },
      en_camino: { color: 'info', label: 'En Camino', icon: FiTruck },
      entregado: { color: 'success', label: 'Entregado', icon: FiCheckCircle },
      completado: { color: 'success', label: 'Completado', icon: FiCheckCircle },
      cancelado: { color: 'danger', label: 'Cancelado', icon: FiX },
    };
    return badges[status] || badges.pendiente;
  };

  const getDeliveryTypeBadge = (type, notes = '') => {
    // Si el tipo está definido, usarlo
    if (type === 'delivery') {
      return { color: 'purple', icon: FiTruck, label: 'Delivery' };
    }
    if (type === 'pickup') {
      return { color: 'green', icon: FiShoppingBag, label: 'Recoger en Tienda' };
    }

    // Si no está definido, intentar detectarlo desde las notas
    if (notes && notes.toLowerCase().includes('entrega:')) {
      const notesLower = notes.toLowerCase();
      if (notesLower.includes('zona') || notesLower.includes('direcci') || notesLower.includes('delivery')) {
        return { color: 'purple', icon: FiTruck, label: 'Delivery' };
      }
      if (notesLower.includes('recoger') || notesLower.includes('pickup') || notesLower.includes('tienda')) {
        return { color: 'green', icon: FiShoppingBag, label: 'Recoger en Tienda' };
      }
    }

    // Por defecto, asumir que tiene dirección = delivery, sin dirección = pickup
    return { color: 'gray', icon: FiPackage, label: 'Tipo no especificado' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Pedidos Online
          </h1>
          <p className="text-neutral-600 mt-1">
            Gestiona pedidos desde confirmación hasta entrega (pickup y delivery)
          </p>
        </div>
        <button
          onClick={cargarPedidos}
          disabled={loading}
          className="btn-outline flex items-center space-x-2"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-warning-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <FiClock className="text-2xl text-warning-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">En Preparación</p>
              <p className="text-2xl font-bold text-primary-600">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FiPackage className="text-2xl text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Listos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.listos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiTruck className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-success-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Completados</p>
              <p className="text-2xl font-bold text-success-600">{stats.completados}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-2xl text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas Principales */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {/* Tabs Header */}
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              onClick={() => setFiltroEstado('activos')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all border-b-2 ${
                filtroEstado === 'activos'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiClock className="text-xl" />
                <span>Pedidos Activos</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  filtroEstado === 'activos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {stats.pending + stats.inProgress + stats.listos}
                </span>
              </div>
            </button>
            <button
              onClick={() => setFiltroEstado('completados')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all border-b-2 ${
                filtroEstado === 'completados'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiCheckCircle className="text-xl" />
                <span>Historial Completados</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  filtroEstado === 'completados'
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {stats.completados}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Filtros dentro de la pestaña */}
        <div className="p-4 bg-neutral-50 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-neutral-700">Filtrar por tipo:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === 'todos'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltro('pickup')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  filtro === 'pickup'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                }`}
              >
                <FiShoppingBag />
                <span>Recoger en Tienda</span>
              </button>
              <button
                onClick={() => setFiltro('delivery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  filtro === 'delivery'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                }`}
              >
                <FiTruck />
                <span>Delivery</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      ) : (() => {
        const pedidosFiltrados = pedidos;

        return pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <FiPackage className="text-6xl text-neutral-300 mx-auto mb-4" />
            <p className="text-xl text-neutral-500 font-medium">
              {filtroEstado === 'activos' && 'No hay pedidos activos'}
              {filtroEstado === 'completados' && 'No hay pedidos completados'}
            </p>
            <p className="text-sm text-neutral-400 mt-2">
              {filtroEstado === 'activos' && 'Los nuevos pedidos aparecerán aquí automáticamente'}
              {filtroEstado === 'completados' && 'Los pedidos entregados aparecerán en este historial'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pedidosFiltrados.map((pedido) => {
            // Usar status del pedido (no preparationStatus, eso es de invoices)
            const currentStatus = pedido.status || 'pendiente';
            const statusBadge = getPreparationStatusBadge(currentStatus);
            const deliveryBadge = getDeliveryTypeBadge(pedido.deliveryType, pedido.notes);
            const StatusIcon = statusBadge.icon;
            const DeliveryIcon = deliveryBadge.icon;

            // Usar orderNumber (no invoiceNumber)
            const orderNumber = pedido.orderNumber || `#${pedido.id}`;
            const orderDate = pedido.createdAt;

            // Debug para ver qué está pasando
            console.log(`Pedido ${orderNumber}:`, {
              preparationStatus: currentStatus,
              status: pedido.status,
              deliveryType: pedido.deliveryType,
              notes: pedido.notes?.substring(0, 50),
              mostrarBotonPreparar: currentStatus === 'pendiente'
            });

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header del pedido */}
                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-primary-900">
                        {orderNumber}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formatDate(orderDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${deliveryBadge.color}-100 text-${deliveryBadge.color}-700 flex items-center space-x-1`}>
                        <DeliveryIcon className="text-sm" />
                        <span>{deliveryBadge.label}</span>
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusBadge.color}-100 text-${statusBadge.color}-700 flex items-center space-x-1`}>
                        <StatusIcon className="text-sm" />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="p-4 bg-neutral-50 border-b">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Cliente
                  </p>
                  <p className="font-medium text-neutral-900">
                    {(pedido.client || pedido.user) ?
                      `${(pedido.client || pedido.user).firstName} ${(pedido.client || pedido.user).lastName}` :
                      'Cliente General'
                    }
                  </p>
                  {(pedido.client?.email || pedido.user?.email) && (
                    <p className="text-sm text-neutral-600">{pedido.client?.email || pedido.user?.email}</p>
                  )}

                  {/* Información de delivery */}
                  {pedido.deliveryType === 'delivery' && (
                    <div className="mt-3 space-y-2">
                      {pedido.deliveryAddress && (
                        <div className="flex items-start space-x-2 text-sm">
                          <FiMapPin className="text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-700">{pedido.deliveryAddress}</span>
                        </div>
                      )}
                      {pedido.deliveryPhone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FiPhone className="text-primary-600" />
                          <a href={`tel:${pedido.deliveryPhone}`} className="text-primary-600 hover:underline">
                            {pedido.deliveryPhone}
                          </a>
                        </div>
                      )}
                      {pedido.deliveryNotes && (
                        <div className="flex items-start space-x-2 text-sm bg-blue-50 p-2 rounded">
                          <FiFileText className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-700">{pedido.deliveryNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Productos */}
                <div className="p-4 border-b">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                    Productos
                  </p>
                  <div className="space-y-2">
                    {(pedido.items || pedido.products || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {item.product?.name || item.name || 'Producto'}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs text-neutral-500">SKU: {item.product.sku}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-neutral-900">x{item.quantity}</p>
                          <p className="text-xs text-neutral-600">
                            {formatCurrency(item.unitPrice || item.price || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total y acciones */}
                <div className="p-4 bg-neutral-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-neutral-600">Total:</span>
                    <span className="text-2xl font-bold text-success-600">
                      {formatCurrency(pedido.total)}
                    </span>
                  </div>

                  {/* Botones según estado */}
                  <div className="space-y-2">
                    {/* ESTADO: PENDIENTE - Requiere confirmación telefónica */}
                    {currentStatus === 'pendiente' && (
                      <>
                        <button
                          onClick={() => confirmarPedido(pedido.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                        >
                          <FiPhone />
                          <span>📞 Confirmar Pedido (Llamar Cliente)</span>
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                        >
                          <FiX />
                          <span>Cancelar (No confirma)</span>
                        </button>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 text-center">
                            ⚠️ Primero debes llamar al cliente para confirmar
                          </p>
                        </div>
                      </>
                    )}

                    {/* ESTADO: CONFIRMADO */}
                    {currentStatus === 'confirmado' && (
                      <>
                        <button
                          onClick={() => comenzarPreparacion(pedido.id)}
                          className="w-full btn-primary flex items-center justify-center space-x-2"
                        >
                          <FiPackage />
                          <span>Comenzar a Preparar</span>
                        </button>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Deshacer (Volver a Pendiente)</span>
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
                        >
                          <FiX />
                          <span>Cancelar</span>
                        </button>
                      </>
                    )}

                    {/* ESTADO: EN_PREPARACION */}
                    {currentStatus === 'en_preparacion' && (
                      <>
                        <button
                          onClick={() => marcarListo(pedido.id)}
                          className="w-full btn-success flex items-center justify-center space-x-2"
                        >
                          <FiCheckCircle />
                          <span>Marcar como Listo</span>
                        </button>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Deshacer (Volver a Confirmado)</span>
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
                        >
                          <FiX />
                          <span>Cancelar (sin stock, etc.)</span>
                        </button>
                      </>
                    )}

                    {/* ESTADO: LISTO_PARA_RECOGER (PICKUP) */}
                    {(currentStatus === 'listo_para_recoger' || (currentStatus === 'listo' && pedido.deliveryType === 'pickup')) && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-3">
                          <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2 mb-2">
                            <FiShoppingBag />
                            <span>Pedido Listo para Recoger</span>
                          </p>
                          <p className="text-xs text-green-700 text-center">
                            El cliente puede pasar a recoger su pedido. Marca como entregado cuando lo recoja.
                          </p>
                        </div>
                        <button
                          onClick={() => marcarEntregado(pedido.id)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                        >
                          <FiCheckCircle />
                          <span>✓ Cliente Recogió el Pedido</span>
                        </button>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Deshacer (Volver a En Preparación)</span>
                        </button>
                      </>
                    )}

                    {/* ESTADO: LISTO_PARA_ENVIO (DELIVERY) - Esperando repartidor */}
                    {currentStatus === 'listo_para_envio' && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                          <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2 mb-2">
                            <FiGift />
                            <span>Pedido Listo para Envío</span>
                          </p>
                          <p className="text-xs text-green-700 text-center">
                            El pedido está esperando que un repartidor lo recoja
                          </p>
                        </div>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Deshacer (Volver a En Preparación)</span>
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
                        >
                          <FiX />
                          <span>Cancelar</span>
                        </button>
                      </>
                    )}

                    {/* ESTADO: EN_CAMINO (DELIVERY) - Repartidor ya lo tiene */}
                    {currentStatus === 'en_camino' && (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                          <p className="text-sm font-semibold text-blue-800 flex items-center justify-center space-x-2 mb-2">
                            <FiTruck />
                            <span>Pedido En Camino</span>
                          </p>
                          <p className="text-xs text-blue-700 text-center">
                            El repartidor tiene el pedido y está en ruta de entrega
                          </p>
                        </div>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Deshacer (Volver a Listo para Envío)</span>
                        </button>
                      </>
                    )}

                    {(currentStatus === 'listo' && pedido.deliveryType === 'delivery') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                        <p className="text-sm font-semibold text-yellow-800 flex items-center justify-center space-x-2 mb-2">
                          <FiClock />
                          <span>Esperando repartidor</span>
                        </p>
                        <p className="text-xs text-yellow-700 text-center">
                          El recibo se generará automáticamente cuando el repartidor confirme la entrega
                        </p>
                      </div>
                    )}

                    {(currentStatus === 'entregado' || currentStatus === 'completado') && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                          <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2">
                            <FiCheckCircle />
                            <span>Pedido Completado</span>
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Recibo generado automáticamente
                          </p>
                          {pedido.deliveredAt && (
                            <p className="text-xs text-green-600 mt-2">
                              Entregado: {formatDate(pedido.deliveredAt)}
                            </p>
                          )}
                        </div>
                        {pedido.receiptId && (
                          <div className="mt-3 space-y-2">
                            <div className="p-3 bg-white border border-green-200 rounded-lg">
                              <p className="text-xs text-neutral-600 mb-2 flex items-center justify-center space-x-1">
                                <FiFileText className="text-green-600" />
                                <span className="font-semibold">Recibo #{pedido.receiptId}</span>
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => window.open(`/recibos/${pedido.receiptId}`, '_blank')}
                                className="btn-outline text-sm flex items-center justify-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <FiFileText />
                                <span>Ver Recibo</span>
                              </button>
                              <button
                                onClick={() => descargarRecibo(pedido.receiptId, pedido.orderNumber)}
                                className="bg-success-600 hover:bg-success-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                              >
                                <FiDownload />
                                <span>Descargar PDF</span>
                              </button>
                            </div>
                          </div>
                        )}
                        {!pedido.receiptId && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <p className="text-xs text-yellow-800">
                              ⚠️ Este pedido aún no tiene recibo generado
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* Modal de Cancelación */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setPedidoToCancel(null);
        }}
        order={pedidoToCancel}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
};

export default PedidosOnlinePage;

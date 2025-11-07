/**
 * @author Alexander Echeverria
 * @file PedidosEntregaPage.jsx
 * @description Panel para repartidores - Gestión de entregas
 * @location /src/pages/repartidor/PedidosEntregaPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiRefreshCw,
  FiClock,
  FiNavigation,
  FiCornerUpLeft,
  FiGift,
  FiX
} from 'react-icons/fi';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import CancelOrderModal from '../../components/orders/CancelOrderModal';

const PedidosEntregaPage = () => {
  const { user } = useAuth();
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('disponibles'); // 'disponibles' o 'mis-pedidos'
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ready: 0, inRoute: 0 });

  // Estados para indicadores de carga individuales por pedido
  const [loadingStates, setLoadingStates] = useState({}); // { [pedidoId]: boolean }

  // Estado para el modal de cancelación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pedidoToCancel, setPedidoToCancel] = useState(null);

  useEffect(() => {
    cargarPedidos();

    // Actualizar cada 30 segundos
    const interval = setInterval(cargarPedidos, 30000);
    return () => clearInterval(interval);
  }, [vistaActiva]);

  const cargarPedidos = async () => {
    setLoading(true);

    try {
      console.log('🔍 Vista activa:', vistaActiva);

      // CAMBIO IMPORTANTE: Ahora traemos TODOS los pedidos de tipo delivery
      // No importa el estado, se mostrarán todos
      const response = await orderService.getAllOrders({
        deliveryType: 'delivery',
        // No filtramos por estado, queremos ver TODOS
        limit: 100 // Aumentar si tienes más pedidos
      });

      console.log('📦 Pedidos delivery cargados:', response);
      console.log('📊 Total de pedidos:', response.orders?.length);

      const allOrders = response.orders || [];

      // Log de estados disponibles
      console.log('📝 Estados en los pedidos:', allOrders.map(p => ({
        id: p.id,
        orderNumber: p.orderNumber,
        status: p.status
      })));

      // Separar pedidos según la vista
      if (vistaActiva === 'disponibles') {
        // En "Disponibles": Solo mostrar pedidos listos para que el repartidor los tome
        const disponibles = allOrders.filter(p =>
          p.status === 'listo_para_envio' ||
          p.status === 'listo' ||
          p.status === 'listo_para_recoger'
        );

        console.log('✅ Pedidos disponibles:', disponibles.length);
        setPedidosDisponibles(disponibles);

        setStats({
          ready: disponibles.length,
          inRoute: allOrders.filter(p => p.status === 'en_camino').length
        });
      } else {
        // En "Mis Pedidos": Mostrar TODOS los pedidos delivery
        console.log('📋 Mostrando todos los pedidos en "Mis Pedidos":', allOrders.length);

        // Ordenar pedidos: los no entregados primero, luego los entregados
        const pedidosOrdenados = [...allOrders].sort((a, b) => {
          const aEntregado = ['entregado', 'completado'].includes(a.status);
          const bEntregado = ['entregado', 'completado'].includes(b.status);

          // Si uno está entregado y el otro no, el no entregado va primero
          if (aEntregado && !bEntregado) return 1;
          if (!aEntregado && bEntregado) return -1;

          // Si ambos están en el mismo grupo (entregados o no entregados),
          // ordenar por fecha (más recientes primero)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        console.log('📋 Pedidos ordenados (no entregados primero)');
        setMisPedidos(pedidosOrdenados);

        // Actualizar stats con conteos reales
        const enPreparacion = allOrders.filter(p =>
          ['pendiente', 'confirmado', 'en_preparacion'].includes(p.status)
        ).length;

        const listosParaEnvio = allOrders.filter(p =>
          p.status === 'listo_para_envio'
        ).length;

        const enCamino = allOrders.filter(p =>
          p.status === 'en_camino'
        ).length;

        const entregados = allOrders.filter(p =>
          ['entregado', 'completado'].includes(p.status)
        ).length;

        console.log('📊 Stats:', { enPreparacion, listosParaEnvio, enCamino, entregados });

        setStats({
          ready: listosParaEnvio,
          inRoute: enCamino
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const tomarPedido = async (orderId) => {
    // Confirmar que el repartidor tiene el pedido
    const confirmed = window.confirm(
      '¿Confirmas que tienes el pedido y estás listo para salir a entregar?'
    );

    if (!confirmed) return;

    try {
      // Activar indicador de carga para este pedido
      setLoadingStates(prev => ({ ...prev, [orderId]: true }));

      console.log('📦 Tomando pedido:', orderId);
      console.log('👤 Usuario repartidor:', user.id);

      // ✅ El repartidor SOLO cambia el estado a 'en_camino'
      // El backend automáticamente asigna el repartidor (línea 901 del controller)
      await orderService.updateOrderStatus(orderId, 'en_camino');

      toast.success('✅ Pedido tomado. Ahora está en camino');
      cargarPedidos();
    } catch (error) {
      console.error('❌ Error al tomar pedido:', error);
      toast.error(error.message || 'Error al tomar pedido');
    } finally {
      // Desactivar indicador de carga
      setLoadingStates(prev => ({ ...prev, [orderId]: false }));
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

  const marcarEntregado = async (orderId) => {
    if (!confirm('¿Confirmar que el pedido fue entregado al cliente?')) return;

    try {
      // Activar indicador de carga para este pedido
      setLoadingStates(prev => ({ ...prev, [orderId]: true }));

      console.log('📦 Marcando como entregado - Pedido ID:', orderId);
      console.log('👤 Usuario repartidor:', user.id);
      console.log('🔄 Cambiando estado a: entregado');

      await orderService.updateOrderStatus(orderId, 'entregado');

      console.log('✅ Pedido marcado como entregado exitosamente');
      toast.success('✅ Pedido entregado correctamente. Generando recibo...');
      cargarPedidos();
    } catch (error) {
      console.error('❌ Error al marcar como entregado:', error);
      console.error('❌ Detalles del error:', error.response?.data);
      toast.error(error.message || 'Error al marcar como entregado');
    } finally {
      // Desactivar indicador de carga
      setLoadingStates(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Nueva función: Retroceder estado (Deshacer)
  const retrocederEstado = async (orderId) => {
    try {
      console.log('🔄 Retrocediendo estado del pedido:', orderId);

      // Buscar el pedido actual
      const pedidoActual = (vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos).find(p => p.id === orderId);

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado');
      }

      // Para repartidores, solo permitir retroceder de 'en_camino' a 'en_preparacion'
      const estadosRetroceso = {
        'en_camino': 'en_preparacion'
      };

      const nuevoEstado = estadosRetroceso[pedidoActual.status];

      if (!nuevoEstado) {
        toast.error('No se puede retroceder desde este estado');
        return;
      }

      // Confirmar la acción
      if (!confirm(`¿Deshacer y volver al estado "${nuevoEstado}"?\n\nEsto devolverá el pedido a preparación y se podrá reasignar.`)) {
        return;
      }

      console.log(`⬅️ Retrocediendo de "${pedidoActual.status}" a "${nuevoEstado}"`);

      // Actualizar el estado
      await orderService.updateOrderStatus(orderId, nuevoEstado);
      toast.success(`Estado revertido a: ${nuevoEstado}`);
      cargarPedidos();

    } catch (error) {
      console.error('❌ Error al retroceder estado:', error);
      toast.error(error.message || 'Error al retroceder estado');
    }
  };

  const abrirMapa = (address) => {
    if (!address) {
      toast.error('No hay dirección disponible');
      return;
    }

    // Abrir Google Maps con la dirección
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const llamarCliente = (phone) => {
    if (!phone) {
      toast.error('No hay número de teléfono disponible');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const pedidos = vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos;

  const getStatusBadge = (status) => {
    const badges = {
      listo: { color: 'success', label: 'Listo para Entregar', icon: FiCheckCircle },
      listo_para_recoger: { color: 'success', label: 'Listo', icon: FiCheckCircle },
      listo_para_envio: { color: 'success', label: 'Listo para Envío', icon: FiGift },
      en_camino: { color: 'primary', label: 'En Camino', icon: FiTruck },
      entregado: { color: 'success', label: 'Entregado', icon: FiCheckCircle },
      completado: { color: 'success', label: 'Completado', icon: FiCheckCircle },
    };
    return badges[status] || badges.listo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Panel de Entregas
          </h1>
          <p className="text-neutral-600 mt-1">
            Gestiona tus entregas a domicilio
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
              <p className="text-sm text-neutral-600">En Preparación</p>
              <p className="text-2xl font-bold text-warning-600">
                {(vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos).filter(p =>
                  ['pendiente', 'confirmado', 'en_preparacion'].includes(p.status)
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <FiClock className="text-2xl text-warning-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-success-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Listos para Envío</p>
              <p className="text-2xl font-bold text-success-600">
                {(vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos).filter(p =>
                  p.status === 'listo_para_envio'
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <FiGift className="text-2xl text-success-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">En Camino</p>
              <p className="text-2xl font-bold text-primary-600">
                {(vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos).filter(p =>
                  p.status === 'en_camino'
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FiTruck className="text-2xl text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Entregados</p>
              <p className="text-2xl font-bold text-blue-600">
                {(vistaActiva === 'disponibles' ? pedidosDisponibles : misPedidos).filter(p =>
                  ['entregado', 'completado'].includes(p.status)
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setVistaActiva('disponibles')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              vistaActiva === 'disponibles'
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <FiGift />
            <span>Disponibles para Tomar ({pedidosDisponibles.length})</span>
          </button>
          <button
            onClick={() => setVistaActiva('mis-pedidos')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              vistaActiva === 'mis-pedidos'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <FiPackage />
            <span>Todos los Pedidos Delivery ({misPedidos.length})</span>
          </button>
        </div>
        <div className="mt-3 text-xs text-neutral-600 text-center">
          {vistaActiva === 'disponibles' ? (
            <p>📦 Pedidos listos para que los recojas y entregues</p>
          ) : (
            <p>👁️ Ver todos los pedidos delivery (solo editables cuando estén listos para envío)</p>
          )}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FiTruck className="text-6xl text-neutral-300 mx-auto mb-4" />
          <p className="text-xl text-neutral-500 font-medium">
            {vistaActiva === 'disponibles'
              ? 'No hay pedidos disponibles para entregar'
              : 'No tienes pedidos asignados'}
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            {vistaActiva === 'disponibles'
              ? 'Los pedidos listos para entregar aparecerán aquí'
              : 'Toma pedidos desde la pestaña "Disponibles"'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const statusBadge = getStatusBadge(pedido.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header del pedido */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">
                        {pedido.orderNumber || pedido.invoiceNumber}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formatDate(pedido.createdAt || pedido.invoiceDate)}
                      </p>
                      {pedido.estimatedDeliveryTime && (
                        <p className="text-sm text-blue-700 mt-1 flex items-center space-x-1">
                          <FiClock className="text-xs" />
                          <span>
                            Estimado: {new Date(pedido.estimatedDeliveryTime).toLocaleTimeString('es-GT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusBadge.color}-100 text-${statusBadge.color}-700 flex items-center space-x-1`}>
                      <StatusIcon className="text-sm" />
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Información de entrega */}
                <div className="p-4 bg-blue-50 border-b">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                    Datos de Entrega
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FiPackage className="text-primary-600 flex-shrink-0" />
                      <span className="font-medium text-neutral-900">
                        {pedido.client ?
                          `${pedido.client.firstName} ${pedido.client.lastName}` :
                          'Cliente'
                        }
                      </span>
                    </div>

                    {pedido.deliveryPhone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FiPhone className="text-primary-600" />
                          <span className="text-neutral-700">{pedido.deliveryPhone}</span>
                        </div>
                        <button
                          onClick={() => llamarCliente(pedido.deliveryPhone)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Llamar
                        </button>
                      </div>
                    )}

                    {pedido.deliveryAddress && (
                      <div className="flex items-start justify-between space-x-2">
                        <div className="flex items-start space-x-2 flex-1">
                          <FiMapPin className="text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-700">{pedido.deliveryAddress}</span>
                        </div>
                        <button
                          onClick={() => abrirMapa(pedido.deliveryAddress)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 flex-shrink-0"
                        >
                          <FiNavigation className="text-xs" />
                          <span>Ver Mapa</span>
                        </button>
                      </div>
                    )}

                    {pedido.deliveryNotes && (
                      <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start space-x-2">
                          <FiFileText className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                              Instrucciones Especiales:
                            </p>
                            <p className="text-sm text-blue-800">{pedido.deliveryNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div className="p-4 border-b">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                    Productos a Entregar
                  </p>
                  <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                    {pedido.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {item.product?.name || 'Producto'}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs text-neutral-500">SKU: {item.product.sku}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-neutral-900">x{item.quantity}</p>
                          <p className="text-xs text-neutral-600">
                            {formatCurrency(item.total || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total y acciones */}
                <div className="p-4 bg-neutral-50">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-600">
                        Total a Cobrar:
                      </span>
                      <span className="text-3xl font-bold text-success-600">
                        {formatCurrency(pedido.total)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 text-right">
                      Método: {pedido.paymentMethod?.toUpperCase() || 'N/A'}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="space-y-2">
                    {/* ========== VISTA: DISPONIBLES ========== */}
                    {vistaActiva === 'disponibles' && (
                      pedido.status === 'listo' ||
                      pedido.status === 'listo_para_recoger' ||
                      pedido.status === 'listo_para_envio'
                    ) && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                          <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2">
                            <FiGift />
                            <span>Pedido Listo para Recoger</span>
                          </p>
                          <p className="text-xs text-green-700 text-center mt-1">
                            Este pedido está empacado y listo en la farmacia
                          </p>
                        </div>
                        <button
                          onClick={() => tomarPedido(pedido.id)}
                          disabled={loadingStates[pedido.id]}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingStates[pedido.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <FiTruck />
                              <span>✅ Tomar para Entregar</span>
                            </>
                          )}
                        </button>
                        {!loadingStates[pedido.id] && (
                          <p className="text-xs text-center text-neutral-500">
                            Confirmarás que tienes el pedido y saldrás a entregar
                          </p>
                        )}
                      </>
                    )}

                    {/* ========== VISTA: MIS PEDIDOS ========== */}

                    {/* PENDIENTE / CONFIRMADO / EN_PREPARACION - Solo vista (no editable) */}
                    {vistaActiva === 'mis-pedidos' && ['pendiente', 'confirmado', 'en_preparacion'].includes(pedido.status) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <p className="text-sm font-semibold text-blue-800 flex items-center justify-center space-x-2 mb-2">
                          <FiClock />
                          <span>Pedido en Preparación</span>
                        </p>
                        <p className="text-xs text-blue-700 text-center">
                          Este pedido está siendo preparado por el vendedor. Aparecerá en "Disponibles" cuando esté listo.
                        </p>
                      </div>
                    )}

                    {/* LISTO_PARA_ENVIO - Puede tomarlo */}
                    {vistaActiva === 'mis-pedidos' && pedido.status === 'listo_para_envio' && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                          <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2">
                            <FiGift />
                            <span>Pedido Listo - Puedes Tomarlo</span>
                          </p>
                          <p className="text-xs text-green-700 text-center mt-1">
                            Este pedido está listo en la farmacia
                          </p>
                        </div>
                        <button
                          onClick={() => tomarPedido(pedido.id)}
                          disabled={loadingStates[pedido.id]}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingStates[pedido.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <FiTruck />
                              <span>✅ Tomar para Entregar</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* EN_CAMINO - Puede marcar entregado */}
                    {vistaActiva === 'mis-pedidos' && pedido.status === 'en_camino' && (
                      <>
                        <button
                          onClick={() => marcarEntregado(pedido.id)}
                          disabled={loadingStates[pedido.id]}
                          className="w-full btn-success flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingStates[pedido.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <FiCheckCircle />
                              <span>✅ Marcar como Entregado</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
                        >
                          <FiX />
                          <span>Cancelar (Cliente no recibió)</span>
                        </button>
                        <button
                          onClick={() => retrocederEstado(pedido.id)}
                          className="w-full btn-outline text-sm flex items-center justify-center space-x-2"
                        >
                          <FiCornerUpLeft />
                          <span>Volver a "Listo para Envío"</span>
                        </button>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <p className="text-xs text-blue-700 text-center">
                            📄 Confirma cuando hayas entregado el pedido al cliente
                          </p>
                        </div>
                      </>
                    )}

                    {/* ENTREGADO / COMPLETADO - Solo vista */}
                    {vistaActiva === 'mis-pedidos' && (pedido.status === 'entregado' || pedido.status === 'completado') && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-green-800 flex items-center justify-center space-x-2">
                          <FiCheckCircle />
                          <span>Pedido Entregado ✅</span>
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Recibo generado automáticamente
                        </p>
                      </div>
                    )}

                    {/* CANCELADO - Solo vista */}
                    {vistaActiva === 'mis-pedidos' && pedido.status === 'cancelado' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-red-800 flex items-center justify-center space-x-2">
                          <FiX />
                          <span>Pedido Cancelado</span>
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Este pedido fue cancelado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

export default PedidosEntregaPage;

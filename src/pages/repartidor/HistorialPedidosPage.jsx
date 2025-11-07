/**
 * @author Alexander Echeverria
 * @file HistorialPedidosPage.jsx
 * @description Historial completo de pedidos del repartidor con filtros y estadísticas
 * @location /src/pages/repartidor/HistorialPedidosPage.jsx
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
  FiCalendar,
  FiSearch,
  FiFilter,
  FiNavigation
} from 'react-icons/fi';
import QuetzalIcon from '../../components/common/QuetzalIcon';
import orderService from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const HistorialPedidosPage = () => {
  const [activeTab, setActiveTab] = useState('hoy'); // 'hoy' o 'historial'
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    periodo: 'today',
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [activeTab, filtros.periodo]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'hoy') {
        await cargarPedidosHoy();
      } else {
        await cargarHistorial();
      }
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidosHoy = async () => {
    const response = await orderService.getDeliveredToday();
    setPedidos(response.orders || []);
  };

  const cargarHistorial = async () => {
    const params = {};
    if (filtros.status) params.status = filtros.status;
    if (filtros.search) params.search = filtros.search;
    if (filtros.startDate && filtros.endDate) {
      params.startDate = new Date(filtros.startDate).toISOString();
      params.endDate = new Date(filtros.endDate).toISOString();
    }

    const response = await orderService.getDeliveryPersonHistory(params);
    setPedidos(response.orders || []);
  };

  const cargarEstadisticas = async () => {
    const response = await orderService.getDeliveryPersonStats(filtros.periodo);
    setStats(response.stats);
  };

  const aplicarFiltros = () => {
    cargarHistorial();
  };

  const limpiarFiltros = () => {
    setFiltros({
      periodo: 'today',
      status: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const calcularTiempoEntrega = (shippedAt, deliveredAt) => {
    if (!shippedAt || !deliveredAt) return 'N/A';

    const diff = new Date(deliveredAt) - new Date(shippedAt);
    const minutes = Math.floor(diff / 1000 / 60);

    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      listo_para_envio: { color: 'warning', label: 'Listo para Envío', icon: FiPackage },
      en_camino: { color: 'primary', label: 'En Camino', icon: FiTruck },
      entregado: { color: 'success', label: 'Entregado', icon: FiCheckCircle },
      completado: { color: 'success', label: 'Completado', icon: FiCheckCircle }
    };
    return badges[status] || badges.listo_para_envio;
  };

  const abrirMapa = (address) => {
    if (!address) {
      toast.error('No hay dirección disponible');
      return;
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Mi Historial de Entregas
          </h1>
          <p className="text-neutral-600 mt-1">
            Visualiza todas tus entregas y estadísticas
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="btn-outline flex items-center space-x-2"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-success-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Entregados</p>
                <p className="text-2xl font-bold text-success-600">
                  {stats.entregados || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="text-2xl text-success-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">En Camino</p>
                <p className="text-2xl font-bold text-primary-600">
                  {stats.enCamino || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FiTruck className="text-2xl text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-warning-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Recaudado</p>
                <p className="text-2xl font-bold text-warning-600">
                  {formatCurrency(stats.totalRecaudado || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <QuetzalIcon className="text-2xl text-warning-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.promedioTiempoEntrega || 0} min
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiClock className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Periodo */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Periodo:</label>
          <select
            value={filtros.periodo}
            onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
            className="input-field text-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="all">Todo</option>
          </select>

          <button
            onClick={() => setActiveTab('historial')}
            className="btn-outline text-sm flex items-center space-x-1"
          >
            <FiCalendar />
            <span>Ver Historial Completo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('hoy')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'hoy'
                ? 'bg-success-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <FiCheckCircle />
            <span>Entregados Hoy ({pedidos.filter(p => activeTab === 'hoy').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'historial'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <FiCalendar />
            <span>Historial Completo</span>
          </button>
        </div>
      </div>

      {/* Filtros (solo en tab historial) */}
      {activeTab === 'historial' && (
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center mb-3">
            <FiFilter className="text-neutral-600 mr-2" />
            <h3 className="font-semibold text-neutral-900">Filtros Avanzados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">Todos</option>
                <option value="listo_para_envio">Listo para Envío</option>
                <option value="en_camino">En Camino</option>
                <option value="entregado">Entregado</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.startDate}
                onChange={(e) => setFiltros({ ...filtros, startDate: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.endDate}
                onChange={(e) => setFiltros({ ...filtros, endDate: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="# pedido o dirección"
                  value={filtros.search}
                  onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                  className="input-field text-sm pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button onClick={aplicarFiltros} className="btn-primary text-sm">
              Aplicar Filtros
            </button>
            <button onClick={limpiarFiltros} className="btn-outline text-sm">
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FiPackage className="text-6xl text-neutral-300 mx-auto mb-4" />
          <p className="text-xl text-neutral-500 font-medium">
            {activeTab === 'hoy'
              ? 'No has entregado pedidos hoy'
              : 'No se encontraron pedidos'}
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
                        {pedido.orderNumber}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formatDate(pedido.createdAt)}
                      </p>
                      {pedido.deliveredAt && (
                        <p className="text-sm text-success-700 mt-1 flex items-center space-x-1">
                          <FiCheckCircle className="text-xs" />
                          <span>
                            Entregado: {new Date(pedido.deliveredAt).toLocaleString('es-GT')}
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
                        {pedido.client
                          ? `${pedido.client.firstName} ${pedido.client.lastName}`
                          : 'Cliente'}
                      </span>
                    </div>

                    {(pedido.deliveryPhone || pedido.client?.phone) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FiPhone className="text-primary-600" />
                          <span className="text-neutral-700">
                            {pedido.deliveryPhone || pedido.client?.phone}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            llamarCliente(pedido.deliveryPhone || pedido.client?.phone)
                          }
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Llamar
                        </button>
                      </div>
                    )}

                    {(pedido.deliveryAddress || pedido.shippingAddress) && (
                      <div className="flex items-start justify-between space-x-2">
                        <div className="flex items-start space-x-2 flex-1">
                          <FiMapPin className="text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-700">
                            {pedido.deliveryAddress || pedido.shippingAddress}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            abrirMapa(pedido.deliveryAddress || pedido.shippingAddress)
                          }
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 flex-shrink-0"
                        >
                          <FiNavigation className="text-xs" />
                          <span>Mapa</span>
                        </button>
                      </div>
                    )}

                    {pedido.deliveryNotes && (
                      <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start space-x-2">
                          <FiFileText className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                              Instrucciones:
                            </p>
                            <p className="text-sm text-blue-800">{pedido.deliveryNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tiempo de entrega */}
                    {pedido.shippedAt && pedido.deliveredAt && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs font-semibold text-neutral-500 mb-1">
                          Tiempo de Entrega
                        </p>
                        <p className="text-lg font-bold text-success-600">
                          {calcularTiempoEntrega(pedido.shippedAt, pedido.deliveredAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div className="p-4 border-b">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                    Productos Entregados
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

                {/* Total */}
                <div className="p-4 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">Total Cobrado:</span>
                    <span className="text-2xl font-bold text-success-600">
                      {formatCurrency(pedido.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistorialPedidosPage;

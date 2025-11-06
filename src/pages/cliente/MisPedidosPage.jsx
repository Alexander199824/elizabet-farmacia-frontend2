/**
 * @author Alexander Echeverria
 * @file MisPedidosPage.jsx
 * @description Página de pedidos del cliente
 * @location /src/pages/cliente/MisPedidosPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiPackage, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiEye } from 'react-icons/fi';
import invoiceService from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MisPedidosPage = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPedidos();
    }
  }, [user]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getAllInvoices({
        clientId: user.id,
        page: 1,
        limit: 100,
        sortBy: 'invoiceDate',
        sortOrder: 'desc'
      });
      setPedidos(response.invoices || []);
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

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroEstado);

  const handleViewDetails = async (pedido) => {
    try {
      const details = await invoiceService.getInvoiceById(pedido.id);
      setSelectedPedido(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching pedido details:', error);
      toast.error('Error al cargar los detalles del pedido');
    }
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
        <div className="flex items-center space-x-2">
          <FiPackage className="text-2xl text-primary-600" />
          <span className="text-lg font-semibold">{pedidosFiltrados.length} pedidos</span>
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
            {pedidos.filter(p => p.status === 'pendiente').length}
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
            {pedidos.filter(p => p.status === 'en_proceso').length}
          </p>
          <p className="text-sm">En Proceso</p>
        </button>
        <button
          onClick={() => setFiltroEstado('completada')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'completada'
              ? 'bg-success-600 text-white shadow-lg'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          <p className="text-2xl font-bold">
            {pedidos.filter(p => p.status === 'completada').length}
          </p>
          <p className="text-sm">Completadas</p>
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
                        <h3 className="text-lg font-bold text-neutral-900">
                          Pedido {pedido.invoiceNumber}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {formatDate(pedido.invoiceDate)}
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(pedido)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <FiEye />
                      <span>Ver Detalles</span>
                    </button>
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

      {/* Modal de Detalles */}
      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Pedido {selectedPedido.invoiceNumber}
                  </h2>
                  <p className="text-neutral-600">{formatDate(selectedPedido.invoiceDate)}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <span className="text-neutral-600">Estado del Pedido:</span>
                <span className={`badge badge-${getStatusConfig(selectedPedido.status).color}`}>
                  {getStatusConfig(selectedPedido.status).label}
                </span>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Productos:</h3>
                <div className="space-y-3">
                  {selectedPedido.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-neutral-600">
                          Cantidad: {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-lg">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedPedido.subtotal || selectedPedido.total)}</span>
                </div>
                {selectedPedido.discount > 0 && (
                  <div className="flex items-center justify-between text-danger-600">
                    <span>Descuento:</span>
                    <span className="font-semibold">-{formatCurrency(selectedPedido.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xl font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-success-600">{formatCurrency(selectedPedido.total)}</span>
                </div>
              </div>

              {/* Info Adicional */}
              <div className="p-4 bg-primary-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Método de Pago:</span>
                  <span className="font-semibold capitalize">{selectedPedido.paymentMethod || 'Efectivo'}</span>
                </div>
                {selectedPedido.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-neutral-600 mb-1">Notas:</p>
                    <p className="font-medium">{selectedPedido.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPedidosPage;

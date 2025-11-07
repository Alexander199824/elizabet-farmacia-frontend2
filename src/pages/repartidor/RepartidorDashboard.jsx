/**
 * @author Alexander Echeverria
 * @file RepartidorDashboard.jsx
 * @description Dashboard del repartidor con datos reales del nuevo sistema de pedidos
 * @location /src/pages/repartidor/RepartidorDashboard.jsx
 */

import { useState, useEffect } from 'react';
import { FiTruck, FiPackage, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import QuetzalIcon from '../../components/common/QuetzalIcon';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RepartidorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pedidosEnCamino, setPedidosEnCamino] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas del día
      const statsResponse = await orderService.getDeliveryPersonStats('today');
      setStats(statsResponse.stats);

      // Obtener todos los pedidos delivery
      const ordersResponse = await orderService.getAllOrders({
        deliveryType: 'delivery',
        limit: 100
      });

      const allOrders = ordersResponse.orders || [];

      // Filtrar pedidos en camino (asignados a este repartidor)
      const enCamino = allOrders.filter(
        (p) => p.status === 'en_camino' && p.deliveryPersonId === user.id
      );
      setPedidosEnCamino(enCamino);

      // Filtrar pedidos disponibles para tomar
      const disponibles = allOrders.filter(
        (p) => p.status === 'listo_para_envio' && !p.deliveryPersonId
      );
      setPedidosDisponibles(disponibles);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
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
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Panel de Entregas
        </h1>
        <p className="text-neutral-600 mt-1">
          Gestiona tus entregas del día
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Entregados Hoy"
          value={stats?.entregados || 0}
          icon={FiCheckCircle}
          color="success"
          description="Completados"
        />
        <StatCard
          title="En Camino"
          value={stats?.enCamino || 0}
          icon={FiTruck}
          color="primary"
          description="Actualmente"
        />
        <StatCard
          title="Disponibles"
          value={stats?.listosParaEnvio || 0}
          icon={FiPackage}
          color="warning"
          description="Para tomar"
        />
        <StatCard
          title="Total Recaudado"
          value={`Q${parseFloat(stats?.totalRecaudado || 0).toFixed(2)}`}
          icon={QuetzalIcon}
          color="primary"
          description="Hoy"
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pedidos En Camino */}
        <div
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-card p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/dashboard/entregas')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Mis Pedidos en Camino</h3>
            <FiTruck className="text-4xl opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-2">{pedidosEnCamino.length}</p>
          <p className="text-primary-100">
            {pedidosEnCamino.length === 0
              ? 'No tienes pedidos en camino'
              : 'pedidos por entregar'}
          </p>
        </div>

        {/* Pedidos Disponibles */}
        <div
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-card p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/dashboard/entregas')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Disponibles para Tomar</h3>
            <FiPackage className="text-4xl opacity-90 text-white" />
          </div>
          <p className="text-3xl font-bold mb-2 text-white">{pedidosDisponibles.length}</p>
          <p className="text-orange-50">
            {pedidosDisponibles.length === 0
              ? 'No hay pedidos disponibles'
              : 'pedidos listos para recoger'}
          </p>
        </div>
      </div>

      {/* Resumen del Día */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-success-50 to-success-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-success-900">Resumen de Hoy</h3>
              <p className="text-sm text-success-700 mt-1">
                {new Date().toLocaleDateString('es-GT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <FiCalendar className="text-3xl text-success-600" />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <FiCheckCircle className="text-4xl text-success-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-success-900">{stats?.entregados || 0}</p>
              <p className="text-sm text-success-700">Pedidos Entregados</p>
            </div>

            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <QuetzalIcon className="text-4xl text-primary-600 mx-auto mb-2" size={48} />
              <p className="text-2xl font-bold text-primary-900">
                {formatCurrency(stats?.totalRecaudado || 0)}
              </p>
              <p className="text-sm text-primary-700">Total Recaudado</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FiClock className="text-4xl text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">
                {stats?.promedioTiempoEntrega || 0} min
              </p>
              <p className="text-sm text-blue-700">Tiempo Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/dashboard/entregas')}
          className="btn-primary py-4 text-lg flex items-center justify-center space-x-2"
        >
          <FiTruck />
          <span>Ver Todas Mis Entregas</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/historial')}
          className="btn-outline py-4 text-lg flex items-center justify-center space-x-2"
        >
          <FiCalendar />
          <span>Ver Historial Completo</span>
        </button>
      </div>
    </div>
  );
};

export default RepartidorDashboard;
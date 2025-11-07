/**
 * @author Alexander Echeverria
 * @file VendedorDashboard.jsx
 * @description Dashboard del vendedor con datos reales
 * @location /src/pages/vendedor/VendedorDashboard.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiTrendingUp, FiPackage, FiPlus, FiUsers } from 'react-icons/fi';
import StatCard from '../../components/dashboard/StatCard';
import QuetzalIcon from '../../components/common/QuetzalIcon';
import invoiceService from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const VendedorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      // Obtener estadísticas del vendedor
      const statsData = await invoiceService.getInvoiceStats({
        sellerId: user.id,
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });

      // Obtener ventas de hoy
      const todaySales = await invoiceService.getAllInvoices({
        sellerId: user.id,
        startDate: startOfDay.toISOString().split('T')[0],
        page: 1,
        limit: 100
      });

      setStats({
        ...statsData,
        todayCount: todaySales.total || 0,
        todayRevenue: todaySales.invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0
      });

      // Obtener ventas recientes del vendedor
      const salesData = await invoiceService.getAllInvoices({
        sellerId: user.id,
        page: 1,
        limit: 10,
        sortBy: 'invoiceDate',
        sortOrder: 'desc'
      });

      setRecentSales(salesData.invoices || []);

    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completada: 'badge-success',
      pendiente: 'badge-warning',
      cancelada: 'badge-danger',
      anulada: 'badge-danger',
    };
    return badges[status] || 'badge';
  };

  const handleViewSale = (saleId) => {
    navigate(`/dashboard/ventas/${saleId}`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Panel de Ventas
          </h1>
          <p className="text-neutral-600 mt-1">
            Bienvenido, {user?.firstName}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/nueva-venta')}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={QuetzalIcon}
          color="success"
          description={`${stats?.total || 0} ventas`}
        />
        <StatCard
          title="Ventas Hoy"
          value={stats?.todayCount || 0}
          icon={FiShoppingCart}
          color="primary"
          description={formatCurrency(stats?.todayRevenue || 0)}
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(stats?.averageTicket?.average || 0)}
          icon={FiTrendingUp}
          color="success"
          description="Por venta"
        />
        <StatCard
          title="Total Vendido"
          value={stats?.total || 0}
          icon={FiPackage}
          color="primary"
          description="Este mes"
        />
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mis Ventas Recientes</h3>
          <button 
            onClick={() => navigate('/dashboard/mis-ventas')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-primary-600">{sale.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-neutral-900">
                        {sale.client ? `${sale.client.firstName} ${sale.client.lastName}` : sale.clientName || 'CF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-success-600">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(sale.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(sale.status)}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewSale(sale.id)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-neutral-500">
                    No hay ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/dashboard/nueva-venta')}
          className="p-6 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
            <FiPlus className="text-2xl text-primary-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Nueva Venta</h3>
          <p className="text-sm text-neutral-600">Registrar una nueva venta</p>
        </button>

        <button
          onClick={() => navigate('/dashboard/productos')}
          className="p-6 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-success-200 transition-colors">
            <FiPackage className="text-2xl text-success-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Ver Productos</h3>
          <p className="text-sm text-neutral-600">Consultar inventario disponible</p>
        </button>

        <button
          onClick={() => navigate('/dashboard/clientes')}
          className="p-6 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
            <FiUsers className="text-2xl text-primary-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Clientes</h3>
          <p className="text-sm text-neutral-600">Gestionar clientes</p>
        </button>
      </div>
    </div>
  );
};

export default VendedorDashboard;
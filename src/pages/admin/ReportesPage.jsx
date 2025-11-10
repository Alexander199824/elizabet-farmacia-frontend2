/**
 * @author Alexander Echeverria
 * @file ReportesPage.jsx
 * @description Sistema completo de reportes - Basado en test del backend
 * @location /src/pages/admin/ReportesPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  FiDownload, FiTrendingUp,
  FiPackage, FiBarChart2, FiAlertCircle, FiShoppingCart,
  FiRefreshCw, FiUsers, FiFileText, FiPieChart,
  FiClock, FiAward, FiActivity
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer
} from 'recharts';
import reportService from '../../services/reportService';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ReportesPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');

  // Date range
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });

  // ==================== ESTADOS DE REPORTES BÁSICOS ====================
  const [dashboardData, setDashboardData] = useState(null);
  const [salesReports, setSalesReports] = useState({
    byProduct: null,
    byCategory: null,
    byClient: null,
    byDay: null
  });
  const [topProducts, setTopProducts] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [expiringProducts, setExpiringProducts] = useState(null);
  const [clientsReport, setClientsReport] = useState(null);

  // ==================== ESTADOS DE REPORTES AVANZADOS ====================
  const [timePeriods, setTimePeriods] = useState(null);
  const [economicAnalysis, setEconomicAnalysis] = useState(null);
  const [bestSalesDays, setBestSalesDays] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'basic') {
      fetchBasicReports();
    } else if (activeTab === 'advanced') {
      fetchAdvancedReports();
    }
  }, [activeTab, period, dateRange]);

  // ==================== FETCH DASHBOARD ====================
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await reportService.getDashboard(period);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH REPORTES BÁSICOS ====================
  const fetchBasicReports = async () => {
    setLoading(true);
    try {
      const [
        salesByCategory,
        salesByDay,
        top,
        inventory,
        expiring,
        clients
      ] = await Promise.all([
        reportService.getSalesReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          groupBy: 'category'
        }),
        reportService.getSalesReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          groupBy: 'day'
        }),
        reportService.getTopProducts({ limit: 10, sortBy: 'revenue' }),
        reportService.getInventoryReport(),
        reportService.getExpiringProducts(30),
        reportService.getClientsReport({ sortBy: 'revenue', limit: 10 })
      ]);

      setSalesReports({
        byProduct: null,
        byCategory: salesByCategory,
        byClient: null,
        byDay: salesByDay
      });
      setTopProducts(top);
      setInventoryData(inventory);
      setExpiringProducts(expiring);
      setClientsReport(clients);
    } catch (error) {
      console.error('Error fetching basic reports:', error);
      toast.error('Error al cargar reportes básicos');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH REPORTES AVANZADOS ====================
  const fetchAdvancedReports = async () => {
    setLoading(true);
    try {
      const [timeAnalysis, economic, bestDays] = await Promise.all([
        reportService.getTimePeriodAnalysis({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }),
        reportService.getEconomicAnalysis({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }),
        reportService.getBestSalesDays({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      ]);

      setTimePeriods(timeAnalysis);
      setEconomicAnalysis(economic);
      setBestSalesDays(bestDays);
    } catch (error) {
      console.error('Error fetching advanced reports:', error);
      toast.error('Error al cargar reportes avanzados');
    } finally {
      setLoading(false);
    }
  };

  // ==================== DESCARGAS ====================
  const handleDownload = async (reportType, format) => {
    try {
      toast.loading(`Generando ${format.toUpperCase()}...`);

      const blob = format === 'pdf'
        ? await reportService.exportToPDF(reportType, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: 'day'
          })
        : await reportService.exportToExcel(reportType, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: 'day'
          });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${dateRange.startDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success(`${format.toUpperCase()} descargado exitosamente`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Error al descargar ${format.toUpperCase()}`);
      console.error('Error:', error);
    }
  };

  // ==================== TABS ====================
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FiBarChart2 },
    { id: 'basic', name: 'Reportes Básicos', icon: FiFileText },
    { id: 'advanced', name: 'Análisis Avanzado', icon: FiActivity },
    { id: 'downloads', name: 'Descargas', icon: FiDownload }
  ];

  if (loading && !dashboardData && !salesReports.byDay) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Sistema de Reportes Completo
          </h1>
          <p className="text-neutral-600 mt-1">5 Reportes Básicos + 4 Avanzados + 6 Descargas</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'dashboard' && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
            </select>
          )}
          {activeTab !== 'dashboard' && (
            <>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg"
              />
              <span className="text-neutral-500">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg"
              />
            </>
          )}
          <button
            onClick={() => {
              if (activeTab === 'dashboard') fetchDashboard();
              else if (activeTab === 'basic') fetchBasicReports();
              else if (activeTab === 'advanced') fetchAdvancedReports();
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-neutral-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }
                  `}
                >
                  <Icon className="text-lg" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* ==================== TAB: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && dashboardData && (
            <DashboardTab data={dashboardData} period={period} />
          )}

          {/* ==================== TAB: REPORTES BÁSICOS ==================== */}
          {activeTab === 'basic' && (
            <BasicReportsTab
              salesReports={salesReports}
              topProducts={topProducts}
              inventoryData={inventoryData}
              expiringProducts={expiringProducts}
              clientsReport={clientsReport}
              loading={loading}
            />
          )}

          {/* ==================== TAB: ANÁLISIS AVANZADO ==================== */}
          {activeTab === 'advanced' && (
            <AdvancedReportsTab
              timePeriods={timePeriods}
              economicAnalysis={economicAnalysis}
              bestSalesDays={bestSalesDays}
              loading={loading}
            />
          )}

          {/* ==================== TAB: DESCARGAS ==================== */}
          {activeTab === 'downloads' && (
            <DownloadsTab onDownload={handleDownload} />
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD TAB ====================
const DashboardTab = ({ data, period }) => {
  const periodLabels = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Dashboard - {periodLabels[period]}</h2>
      </div>

      {/* Métricas Principales */}
      {data.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl opacity-80 font-bold">Q</span>
              <FiTrendingUp className="text-2xl" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(parseFloat(data.metrics.ventasTotales) || 0)}
            </p>
            <p className="text-sm opacity-80 mt-1">Ventas Totales</p>
            <p className="text-xs opacity-70 mt-2">
              {data.metrics.numeroTransacciones || 0} transacciones
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FiShoppingCart className="text-3xl opacity-80" />
              <FiPackage className="text-2xl" />
            </div>
            <p className="text-3xl font-bold">
              {data.metrics.productosVendidos || 0}
            </p>
            <p className="text-sm opacity-80 mt-1">Productos Vendidos</p>
            <p className="text-xs opacity-70 mt-2">
              {data.metrics.pedidosOnline || 0} pedidos online
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FiActivity className="text-3xl opacity-80" />
              <FiBarChart2 className="text-2xl" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(parseFloat(data.metrics.ventasTotales) / (data.metrics.numeroTransacciones || 1))}
            </p>
            <p className="text-sm opacity-80 mt-1">Ticket Promedio</p>
            <p className="text-xs opacity-70 mt-2">
              Por transacción
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Dashboard:</strong> Muestra las métricas principales del período seleccionado.
          Cambia el período arriba para ver estadísticas de hoy, esta semana, este mes o este año.
        </p>
      </div>
    </div>
  );
};

// ==================== REPORTES BÁSICOS TAB ====================
const BasicReportsTab = ({
  salesReports,
  topProducts,
  inventoryData,
  expiringProducts,
  clientsReport,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">5 Reportes Básicos</h2>

      {/* 1. Ventas por Categoría */}
      {salesReports?.byCategory && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiPieChart className="mr-2 text-green-600" />
            1. Ventas por Categoría ({salesReports.byCategory.results?.length || 0})
          </h3>

          {/* Tabla de Categorías */}
          {salesReports.byCategory.results?.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {salesReports.byCategory.results.map((item, index) => (
                  <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{item.categoria || 'Sin categoría'}</h4>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(parseFloat(item.totalVentas) || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-neutral-600">Unidades Vendidas</p>
                        <p className="font-medium text-blue-600">{item.cantidadVendida || 0}</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Productos Únicos</p>
                        <p className="font-medium text-purple-600">{item.productosUnicos || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráfico de Pastel */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-center">Distribución de Ventas</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesReports.byCategory.results.map(item => ({
                        name: item.categoria || 'Sin categoría',
                        value: parseFloat(item.totalVentas) || 0
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {salesReports.byCategory.results.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Top 10 Productos */}
      {topProducts?.topProducts && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiAward className="mr-2 text-yellow-600" />
            2. Top 10 Productos Más Vendidos
          </h3>
          <div className="space-y-2">
            {topProducts.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-neutral-500">{item.cantidadVendida} unidades</p>
                  </div>
                </div>
                <span className="text-green-600 font-bold">
                  {formatCurrency(parseFloat(item.totalIngresos) || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Inventario */}
      {inventoryData?.metrics && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiPackage className="mr-2 text-indigo-600" />
            3. Reporte de Inventario
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-blue-600">
                {inventoryData.metrics.totalProductos || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900 mb-1">Valor Inventario</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(parseFloat(inventoryData.metrics.valorInventario) || 0)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-900 mb-1">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inventoryData.metrics.productosStockBajo || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Productos por Vencer */}
      {expiringProducts && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiAlertCircle className="mr-2 text-red-600" />
            4. Productos Próximos a Vencer (30 días)
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-900 mb-1">Total Lotes</p>
              <p className="text-2xl font-bold text-red-600">
                {expiringProducts.totalLotes || 0}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-900 mb-1">Valor en Riesgo</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(parseFloat(expiringProducts.valorEnRiesgo) || 0)}
              </p>
            </div>
          </div>
          {expiringProducts.batches?.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expiringProducts.batches.slice(0, 5).map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <span className="text-sm font-medium">{batch.product.name}</span>
                    <p className="text-xs text-neutral-500">Lote: {batch.batchNumber}</p>
                  </div>
                  <span className="text-sm text-red-600 font-bold">
                    {batch.daysUntilExpiry} días
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Análisis de Clientes */}
      {clientsReport?.metrics && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiUsers className="mr-2 text-cyan-600" />
            5. Análisis de Clientes
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm text-cyan-900 mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-cyan-600">
                {clientsReport.metrics.totalClientes || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900 mb-1">Clientes Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {clientsReport.metrics.clientesActivos || 0}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(parseFloat(clientsReport.metrics.ingresosTotales) || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== REPORTES AVANZADOS TAB ====================
const AdvancedReportsTab = ({ timePeriods, economicAnalysis, bestSalesDays, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Análisis Avanzado</h2>

      {/* 1. Períodos de Tiempo */}
      {timePeriods?.analisisPorPeriodo && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiClock className="mr-2 text-blue-600" />
            1. Análisis por Períodos de Tiempo
          </h3>

          {/* Resumen General */}
          {timePeriods.resumenGeneral && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Resumen del Período</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Ventas</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(parseFloat(timePeriods.resumenGeneral.totalVentas) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Transacciones</p>
                  <p className="text-lg font-bold text-blue-900">
                    {timePeriods.resumenGeneral.totalTransacciones || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Ticket Promedio</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(parseFloat(timePeriods.resumenGeneral.ticketPromedio) || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Análisis por cada período */}
          <div className="space-y-6">
            {Object.entries(timePeriods.analisisPorPeriodo).map(([periodKey, periodData]) => {
              const periodStyles = {
                hour: { icon: '🕐', name: 'Por Hora', borderClass: 'border-blue-200', bgClass: 'bg-blue-50', badgeClass: 'bg-blue-200 text-blue-800' },
                day: { icon: '📅', name: 'Por Día', borderClass: 'border-green-200', bgClass: 'bg-green-50', badgeClass: 'bg-green-200 text-green-800' },
                week: { icon: '📆', name: 'Por Semana', borderClass: 'border-purple-200', bgClass: 'bg-purple-50', badgeClass: 'bg-purple-200 text-purple-800' },
                month: { icon: '🗓️', name: 'Por Mes', borderClass: 'border-orange-200', bgClass: 'bg-orange-50', badgeClass: 'bg-orange-200 text-orange-800' },
                quarter: { icon: '📊', name: 'Por Trimestre', borderClass: 'border-pink-200', bgClass: 'bg-pink-50', badgeClass: 'bg-pink-200 text-pink-800' },
                semester: { icon: '📈', name: 'Por Semestre', borderClass: 'border-indigo-200', bgClass: 'bg-indigo-50', badgeClass: 'bg-indigo-200 text-indigo-800' },
                year: { icon: '📉', name: 'Por Año', borderClass: 'border-red-200', bgClass: 'bg-red-50', badgeClass: 'bg-red-200 text-red-800' }
              };

              const style = periodStyles[periodKey] || { icon: '📊', name: periodKey, borderClass: 'border-gray-200', bgClass: 'bg-gray-50', badgeClass: 'bg-gray-200 text-gray-800' };

              return (
                <div key={periodKey} className={`border ${style.borderClass} ${style.bgClass} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">
                      <span className="mr-2">{style.icon}</span>
                      {style.name}
                    </h4>
                    <span className={`text-xs px-2 py-1 ${style.badgeClass} rounded`}>
                      {periodData.summary.registros} períodos
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-neutral-600">Total</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(parseFloat(periodData.summary.totalVentas) || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-neutral-600">Transacciones</p>
                      <p className="text-sm font-bold text-blue-600">
                        {periodData.summary.totalTransacciones || 0}
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-neutral-600">Ticket Prom.</p>
                      <p className="text-sm font-bold text-purple-600">
                        {formatCurrency(parseFloat(periodData.summary.ticketPromedio) || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Top Periods */}
                  {periodData.topPeriods?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-700 mb-2">🏆 Top 5 períodos:</p>
                      <div className="space-y-1">
                        {periodData.topPeriods.slice(0, 5).map((period, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                            <div className="flex items-center space-x-2 flex-1">
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium truncate">{period.periodo}</span>
                            </div>
                            <div className="flex items-center space-x-3 ml-2">
                              <span className="text-blue-600 font-medium">{period.transacciones}tx</span>
                              <span className="text-green-600 font-bold">
                                {formatCurrency(parseFloat(period.total) || 0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Análisis Económico */}
      {economicAnalysis?.resumen && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-green-600" />
            2. Análisis Económico Avanzado
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900 mb-1">Ventas Actuales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(parseFloat(economicAnalysis.resumen.ventasActuales) || 0)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-1">Crecimiento</p>
              <p className="text-2xl font-bold text-blue-600">
                {economicAnalysis.resumen.crecimientoVentas || 0}%
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-900 mb-1">Transacciones</p>
              <p className="text-2xl font-bold text-purple-600">
                {economicAnalysis.resumen.transaccionesActuales || 0}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-900 mb-1">Ticket Promedio</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(parseFloat(economicAnalysis.resumen.ticketPromedioActual) || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mejores Días de Venta */}
      {bestSalesDays?.mejorDiaSemana && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiAward className="mr-2 text-yellow-600" />
            3. Mejores Días de Venta
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg text-white">
              <p className="text-sm opacity-80 mb-1">Mejor Día</p>
              <p className="text-3xl font-bold mb-2">{bestSalesDays.mejorDiaSemana.dia}</p>
              <p className="text-lg">{formatCurrency(parseFloat(bestSalesDays.mejorDiaSemana.totalVentas) || 0)}</p>
              <p className="text-sm opacity-80 mt-1">
                {bestSalesDays.mejorDiaSemana.totalTransacciones} transacciones
              </p>
            </div>
            {bestSalesDays.peorDiaSemana && (
              <div className="p-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg text-white">
                <p className="text-sm opacity-80 mb-1">Peor Día</p>
                <p className="text-3xl font-bold mb-2">{bestSalesDays.peorDiaSemana.dia}</p>
                <p className="text-lg">{formatCurrency(parseFloat(bestSalesDays.peorDiaSemana.totalVentas) || 0)}</p>
                <p className="text-sm opacity-80 mt-1">
                  {bestSalesDays.peorDiaSemana.totalTransacciones} transacciones
                </p>
              </div>
            )}
          </div>

          {/* Ranking de Días */}
          {bestSalesDays.rankingDiasSemana?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-3">Ranking Completo</h4>
              <div className="space-y-2">
                {bestSalesDays.rankingDiasSemana.map((dia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{dia.dia}</span>
                    </div>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(parseFloat(dia.totalVentas) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {bestSalesDays.recomendaciones?.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">Recomendaciones</h4>
              <ul className="space-y-2">
                {bestSalesDays.recomendaciones.map((rec, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium text-blue-900">{rec.tipo}:</span>{' '}
                    <span className="text-blue-800">{rec.mensaje}</span>
                    {rec.impacto && (
                      <span className="ml-2 text-xs text-blue-600">({rec.impacto})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Info sobre Períodos */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-purple-800 text-sm">
          <strong>Análisis Avanzado:</strong> Incluye 7 períodos de tiempo (hora, día, semana, mes, trimestre, semestre, año),
          análisis económico con comparaciones y tendencias, y análisis de mejores días de venta con recomendaciones.
        </p>
      </div>
    </div>
  );
};

// ==================== DESCARGAS TAB ====================
const DownloadsTab = ({ onDownload }) => {
  const downloads = [
    { type: 'sales', name: 'Reporte de Ventas', icon: 'Q', iconComponent: null, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { type: 'economic-analysis', name: 'Análisis Económico', icon: null, iconComponent: FiTrendingUp, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { type: 'best-sales-days', name: 'Mejores Días de Venta', icon: null, iconComponent: FiAward, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Descargas de Reportes</h2>
        <p className="text-neutral-600">6 descargas disponibles (3 reportes × 2 formatos)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {downloads.map((download) => {
          const IconComponent = download.iconComponent;
          return (
            <div key={download.type} className="bg-white border border-neutral-200 rounded-lg p-6">
              <div className={`w-12 h-12 ${download.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                {download.icon ? (
                  <span className={`text-2xl font-bold ${download.textColor}`}>{download.icon}</span>
                ) : (
                  IconComponent && <IconComponent className={`text-2xl ${download.textColor}`} />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-4">{download.name}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onDownload(download.type, 'excel')}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <FiDownload />
                  <span>Descargar Excel</span>
                </button>
                <button
                  onClick={() => onDownload(download.type, 'pdf')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiDownload />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm">
          <strong>Descargas:</strong> Cada reporte puede descargarse en formato Excel (.xlsx) o PDF (.pdf).
          Los reportes incluyen todos los datos del período seleccionado con gráficos y tablas detalladas.
        </p>
      </div>
    </div>
  );
};

export default ReportesPage;

/**
 * @author Alexander Echeverria
 * @file VentasPage.jsx
 * @description Página completa de gestión de ventas con creación de ventas
 * @location /src/pages/admin/VentasPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiDownload, FiX, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import invoiceService from '../../services/invoiceService';
import productService from '../../services/productService';
import clientService from '../../services/clientService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Métodos de pago
const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' }
];

const VentasPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState(null);

  // Estados para crear venta
  const [newSale, setNewSale] = useState({
    clientType: 'final',
    clientId: null,
    clientName: 'Consumidor Final',
    clientNit: 'CF',
    items: [],
    paymentMethod: 'efectivo',
    discount: 0,
    notes: ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Estados para exportar PDF
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [pagination.page, filters]);

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSales();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Solo agregar parámetros si tienen valor
      if (searchTerm) params.search = searchTerm;
      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await invoiceService.getAllInvoices(params);
      
      setSales(response.invoices || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await invoiceService.getInvoiceStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSales();
  };

  const handleViewSale = async (saleId) => {
    try {
      const response = await invoiceService.getInvoiceById(saleId);
      setSelectedSale(response);
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  const handleCancelSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de anular esta venta?')) return;

    const reason = prompt('Motivo de anulación:');
    if (!reason) return;

    try {
      await invoiceService.cancelInvoice(saleId, reason);
      toast.success('Venta anulada exitosamente');
      fetchSales();
      fetchStats();
    } catch (error) {
      toast.error('Error al anular venta');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      completada: 'bg-success-100 text-success-700 px-2 py-1 rounded text-xs font-medium',
      pendiente: 'bg-warning-100 text-warning-700 px-2 py-1 rounded text-xs font-medium',
      cancelada: 'bg-danger-100 text-danger-700 px-2 py-1 rounded text-xs font-medium',
      anulada: 'bg-danger-100 text-danger-700 px-2 py-1 rounded text-xs font-medium',
    };
    return badges[status] || 'bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-medium';
  };

  // ============= FUNCIONES PARA CREAR VENTA =============

  const searchProducts = async (query) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }
    try {
      const response = await productService.searchProducts(query);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const searchClients = async (query) => {
    if (!query || query.length < 2) {
      setClients([]);
      return;
    }
    try {
      const response = await clientService.searchClients(query);
      setClients(response.clients || response.users || []);
    } catch (error) {
      console.error('Error searching clients:', error);
    }
  };

  const addProductToSale = (product) => {
    const existingItem = newSale.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      toast.error('Este producto ya está en la venta');
      return;
    }

    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      discount: 0,
      stock: product.stock
    };

    setNewSale(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setProductSearch('');
    setProducts([]);
    toast.success('Producto agregado');
  };

  const removeProductFromSale = (index) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemQuantity = (index, quantity) => {
    const item = newSale.items[index];
    
    if (quantity > item.stock) {
      toast.error(`Stock insuficiente. Disponible: ${item.stock}`);
      return;
    }

    if (quantity < 1) return;

    setNewSale(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: parseInt(quantity) } : item
      )
    }));
  };

  const updateItemPrice = (index, price) => {
    if (price < 0) return;

    setNewSale(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, unitPrice: parseFloat(price) } : item
      )
    }));
  };

  const selectClient = (client) => {
    setNewSale(prev => ({
      ...prev,
      clientType: 'registered',
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientNit: client.nit || 'CF'
    }));
    setClientSearch('');
    setClients([]);
    toast.success('Cliente seleccionado');
  };

  const calculateSubtotal = () => {
    return newSale.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(newSale.discount) || 0;
    return subtotal - discount;
  };

  const handleCreateSale = async () => {
    // Validaciones
    if (newSale.items.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    if (!newSale.paymentMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }

    setCreatingInvoice(true);

    try {
      const saleData = {
        items: newSale.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        })),
        paymentMethod: newSale.paymentMethod,
        discount: parseFloat(newSale.discount) || 0,
        notes: newSale.notes || null
      };

      // Agregar cliente según el tipo
      if (newSale.clientType === 'registered' && newSale.clientId) {
        saleData.clientId = newSale.clientId;
      } else {
        saleData.clientName = newSale.clientName || 'Consumidor Final';
        saleData.clientNit = newSale.clientNit || 'CF';
      }

      // Agregar sellerId (obtener del usuario logueado)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      saleData.sellerId = user.id;

      const response = await invoiceService.createInvoice(saleData);

      toast.success('¡Venta creada exitosamente!');
      toast.success(`Recibo: ${response.invoice.invoiceNumber}`);

      // Resetear formulario
      setNewSale({
        clientType: 'final',
        clientId: null,
        clientName: 'Consumidor Final',
        clientNit: 'CF',
        items: [],
        paymentMethod: 'efectivo',
        discount: 0,
        notes: ''
      });

      setShowCreateModal(false);
      fetchSales();
      fetchStats();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Error al crear venta');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // ============= FUNCIONES PARA EXPORTAR PDF =============

  const filterSalesByDate = (salesToFilter) => {
    if (!exportDates.startDate && !exportDates.endDate) {
      return salesToFilter;
    }

    return salesToFilter.filter(sale => {
      const saleDate = new Date(sale.invoiceDate);
      const start = exportDates.startDate ? new Date(exportDates.startDate) : null;
      const end = exportDates.endDate ? new Date(exportDates.endDate) : null;

      if (start && end) {
        return saleDate >= start && saleDate <= end;
      } else if (start) {
        return saleDate >= start;
      } else if (end) {
        return saleDate <= end;
      }
      return true;
    });
  };

  const generatePDF = () => {
    const filteredSales = filterSalesByDate(sales);

    if (filteredSales.length === 0) {
      toast.error('No hay ventas en el periodo seleccionado');
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Ventas', 14, 20);

    // Fecha del reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT')}`, 14, 28);

    // Periodo
    if (exportDates.startDate || exportDates.endDate) {
      const startText = exportDates.startDate ? new Date(exportDates.startDate).toLocaleDateString('es-GT') : 'Inicio';
      const endText = exportDates.endDate ? new Date(exportDates.endDate).toLocaleDateString('es-GT') : 'Actualidad';
      doc.text(`Periodo: ${startText} - ${endText}`, 14, 34);
    }

    // Estadísticas generales
    const totalVentas = filteredSales.length;
    const totalIngresos = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
    const promedioTicket = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen:', 14, 44);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Ventas: ${totalVentas}`, 14, 50);
    doc.text(`Ingresos Totales: ${formatCurrency(totalIngresos)}`, 14, 56);
    doc.text(`Ticket Promedio: ${formatCurrency(promedioTicket)}`, 14, 62);

    // Tabla de ventas
    const tableData = filteredSales.map(sale => [
      sale.invoiceNumber,
      formatDate(sale.invoiceDate),
      sale.client ? `${sale.client.firstName} ${sale.client.lastName}` : sale.clientName || 'CF',
      sale.seller ? `${sale.seller.firstName} ${sale.seller.lastName}` : 'N/A',
      formatCurrency(sale.total),
      sale.paymentMethod,
      sale.status
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Recibo', 'Fecha', 'Cliente', 'Vendedor', 'Total', 'Pago', 'Estado']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }, // Total
        6: { halign: 'center' } // Estado
      }
    });

    // Footer con totales
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL: ${formatCurrency(totalIngresos)}`, 14, finalY);

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text(
        `Farmacia Elizabeth - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Guardar PDF
    const fileName = `ventas_${exportDates.startDate || 'todas'}_${exportDates.endDate || 'ahora'}.pdf`;
    doc.save(fileName);

    toast.success('PDF generado exitosamente');
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Gestión de Ventas
          </h1>
          <p className="text-neutral-600 mt-1">
            Administra todas las ventas del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiPlus />
            <span>Nueva Venta</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiDownload />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Total Ventas</p>
            <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Ingresos Totales</p>
            <p className="text-2xl font-bold text-success-600">
              {formatCurrency(stats.totalRevenue || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Ticket Promedio</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(stats.averageTicket?.average || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Completadas</p>
            <p className="text-2xl font-bold text-success-600">
              {stats.byStatus?.find(s => s.status === 'completada')?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por número, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="completada">Completada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
            <option value="anulada">Anulada</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los métodos</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Clear Filters */}
        {Object.values(filters).some(v => v) && (
          <button
            onClick={() => setFilters({ status: '', paymentMethod: '', startDate: '', endDate: '' })}
            className="mt-4 text-sm text-danger-500 hover:text-danger-600 flex items-center space-x-1"
          >
            <FiX />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                    </div>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-primary-600">{sale.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(sale.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-neutral-900">
                        {sale.client ? `${sale.client.firstName} ${sale.client.lastName}` : sale.clientName || 'CF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {sale.seller ? `${sale.seller.firstName} ${sale.seller.lastName}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-success-600">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{sale.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(sale.status)}>{sale.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSale(sale.id)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <FiEye />
                        </button>
                        {sale.status === 'completada' && (
                          <button
                            onClick={() => handleCancelSale(sale.id)}
                            className="text-danger-600 hover:text-danger-700 font-medium text-xs"
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    No se encontraron ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Mostrando {sales.length} de {pagination.total} ventas
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-neutral-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Crear Venta */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <FiShoppingCart className="text-primary-600 text-2xl" />
                <h3 className="text-xl font-semibold">Nueva Venta</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Selección de Cliente */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Cliente</h4>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="clientType"
                        value="final"
                        checked={newSale.clientType === 'final'}
                        onChange={() => setNewSale(prev => ({
                          ...prev,
                          clientType: 'final',
                          clientId: null,
                          clientName: 'Consumidor Final',
                          clientNit: 'CF'
                        }))}
                        className="mr-2"
                      />
                      Consumidor Final
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="clientType"
                        value="registered"
                        checked={newSale.clientType === 'registered'}
                        onChange={() => setNewSale(prev => ({ ...prev, clientType: 'registered' }))}
                        className="mr-2"
                      />
                      Cliente Registrado
                    </label>
                  </div>

                  {newSale.clientType === 'registered' && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre o NIT..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          searchClients(e.target.value);
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {clients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-20">
                          {clients.map(client => (
                            <button
                              key={client.id}
                              onClick={() => selectClient(client)}
                              className="w-full px-4 py-2 text-left hover:bg-neutral-50 border-b last:border-b-0"
                            >
                              <div className="font-medium">{client.firstName} {client.lastName}</div>
                              <div className="text-sm text-neutral-500">NIT: {client.nit || 'N/A'}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {newSale.clientType === 'registered' && newSale.clientId && (
                    <div className="p-3 bg-white rounded border border-success-200">
                      <p className="font-medium text-success-700">✓ {newSale.clientName}</p>
                      <p className="text-sm text-neutral-600">NIT: {newSale.clientNit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Búsqueda y Agregado de Productos */}
              <div>
                <h4 className="font-semibold mb-3">Productos</h4>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      searchProducts(e.target.value);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  {products.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg z-20">
                      {products.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addProductToSale(product)}
                          className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-neutral-500">SKU: {product.sku}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-success-600">{formatCurrency(product.price)}</div>
                              <div className="text-sm text-neutral-500">Stock: {product.stock}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Productos Agregados */}
                {newSale.items.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs">Producto</th>
                          <th className="px-4 py-2 text-left text-xs">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs">Precio Unit.</th>
                          <th className="px-4 py-2 text-left text-xs">Total</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {newSale.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm">
                              {item.productName}
                              <div className="text-xs text-neutral-500">Stock: {item.stock}</div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeProductFromSale(index)}
                                className="text-danger-600 hover:text-danger-700"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 border-2 border-dashed rounded-lg">
                    No hay productos agregados
                  </div>
                )}
              </div>

              {/* Método de Pago y Descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Método de Pago</label>
                  <select
                    value={newSale.paymentMethod}
                    onChange={(e) => setNewSale(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descuento (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newSale.discount}
                    onChange={(e) => setNewSale(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
                <textarea
                  value={newSale.notes}
                  onChange={(e) => setNewSale(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Totales */}
              <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {parseFloat(newSale.discount) > 0 && (
                  <div className="flex justify-between text-danger-600">
                    <span>Descuento:</span>
                    <span className="font-semibold">-{formatCurrency(newSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-success-600 border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="border border-neutral-300 hover:bg-neutral-50 px-6 py-2 rounded-lg transition-colors"
                  disabled={creatingInvoice}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSale}
                  disabled={creatingInvoice || newSale.items.length === 0}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiShoppingCart />
                      Crear Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Detalles de Venta - {selectedSale.invoiceNumber}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Info de la venta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Fecha</p>
                  <p className="font-semibold">
                    {formatDate(selectedSale.invoiceDate)} {selectedSale.invoiceTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Estado</p>
                  <span className={getStatusBadge(selectedSale.status)}>
                    {selectedSale.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Cliente</p>
                  <p className="font-semibold">
                    {selectedSale.client ? 
                      `${selectedSale.client.firstName} ${selectedSale.client.lastName}` : 
                      selectedSale.clientName
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Vendedor</p>
                  <p className="font-semibold">
                    {selectedSale.seller ? 
                      `${selectedSale.seller.firstName} ${selectedSale.seller.lastName}` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2">Productos</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Producto</th>
                        <th className="px-4 py-2 text-left text-xs">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs">Precio</th>
                        <th className="px-4 py-2 text-left text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSale.items?.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">
                            {item.product?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedSale.subtotal)}
                  </span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-danger-600">
                    <span>Descuento:</span>
                    <span className="font-semibold">
                      -{formatCurrency(selectedSale.discount)}
                    </span>
                  </div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedSale.tax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-success-600 border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportar PDF */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiDownload className="text-primary-600 text-xl" />
                <h3 className="text-xl font-semibold">Exportar Ventas a PDF</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-neutral-600 text-sm">
                Selecciona el rango de fechas para filtrar las ventas a exportar.
                Si no seleccionas ninguna fecha, se exportarán todas las ventas visibles.
              </p>

              {/* Selector de Fechas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={exportDates.startDate}
                    onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={exportDates.endDate}
                    onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Preview de resultados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-1">Vista previa:</p>
                <p className="text-sm text-blue-700">
                  {(() => {
                    const filtered = filterSalesByDate(sales);
                    const total = filtered.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
                    return `${filtered.length} venta(s) • Total: ${formatCurrency(total)}`;
                  })()}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={generatePDF}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FiDownload />
                  Generar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasPage;
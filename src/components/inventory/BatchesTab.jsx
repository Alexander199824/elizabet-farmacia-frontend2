/**
 * @author Alexander Echeverria
 * @file BatchesTab.jsx
 * @description Tab de gestión de lotes con CRUD completo
 * @location /src/components/inventory/BatchesTab.jsx
 */

import { useState, useEffect } from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiPackage,
  FiCalendar, FiMapPin, FiAlertCircle, FiLock
} from 'react-icons/fi';
import QuetzalIcon from '../common/QuetzalIcon';
import batchService from '../../services/batchService';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import { formatCurrency, formatDate, daysUntilExpiration, getExpirationStatus } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BatchesTab = ({ onRefresh }) => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    productId: '',
    supplierId: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    batchNumber: '',
    manufacturingDate: '',
    expirationDate: '',
    initialQuantity: 0,
    purchasePrice: 0,
    salePrice: 0,
    location: '',
    invoiceNumber: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchProducts();
    fetchSuppliers();
  }, [pagination.page, filters]);

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchBatches();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };

      const response = await batchService.getAllBatches(params);
      
      setBatches(response.batches || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Error al cargar lotes');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts({ limit: 1000 });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAllSuppliers({ limit: 1000 });
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBatches();
  };

  const handleViewBatch = async (batchId) => {
    try {
      const response = await batchService.getBatchById(batchId);
      setSelectedBatch(response);
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  const handleProductSelect = async (productId) => {
    if (!productId) {
      setSelectedProduct(null);
      return;
    }

    try {
      const product = await productService.getProductById(productId);
      setSelectedProduct(product);

      // Si el producto tiene proveedor, pre-seleccionarlo
      if (product.supplierId) {
        setFormData(prev => ({
          ...prev,
          productId: product.id,
          supplierId: product.supplierId
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          productId: product.id,
          supplierId: ''
        }));
      }
    } catch (error) {
      console.error('Error al obtener producto:', error);
      toast.error('Error al cargar información del producto');
      setSelectedProduct(null);
    }
  };

  const handleOpenForm = (batch = null) => {
    if (batch) {
      setFormData({
        productId: batch.productId || '',
        supplierId: batch.supplierId || '',
        batchNumber: batch.batchNumber || '',
        manufacturingDate: batch.manufacturingDate?.split('T')[0] || '',
        expirationDate: batch.expirationDate?.split('T')[0] || '',
        initialQuantity: batch.initialQuantity || 0,
        purchasePrice: batch.purchasePrice || 0,
        salePrice: batch.salePrice || 0,
        location: batch.location || '',
        invoiceNumber: batch.invoiceNumber || '',
        notes: batch.notes || ''
      });
      setIsEditing(true);
      setSelectedBatch(batch);
    } else {
      setFormData({
        productId: '',
        supplierId: '',
        batchNumber: `LOTE-${Date.now()}`,
        manufacturingDate: '',
        expirationDate: '',
        initialQuantity: 0,
        purchasePrice: 0,
        salePrice: 0,
        location: '',
        invoiceNumber: '',
        notes: ''
      });
      setIsEditing(false);
      setSelectedBatch(null);
    }
    setShowFormModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.productId) {
      toast.error('Selecciona un producto');
      return;
    }

    // Validar proveedor según el producto
    if (selectedProduct?.supplierId && !formData.supplierId) {
      toast.error('El producto requiere un proveedor asignado');
      return;
    }

    if (!formData.expirationDate) {
      toast.error('Ingresa la fecha de vencimiento');
      return;
    }
    if (formData.initialQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      // Preparar payload según las reglas de negocio
      const payload = {
        productId: parseInt(formData.productId),
        batchNumber: formData.batchNumber,
        manufacturingDate: formData.manufacturingDate,
        expirationDate: formData.expirationDate,
        initialQuantity: parseInt(formData.initialQuantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        salePrice: parseFloat(formData.salePrice),
        location: formData.location,
        notes: formData.notes
      };

      // Solo incluir supplierId si tiene valor
      if (formData.supplierId) {
        payload.supplierId = parseInt(formData.supplierId);
      }

      // Solo incluir invoiceNumber si tiene valor
      if (formData.invoiceNumber && formData.invoiceNumber.trim()) {
        payload.invoiceNumber = formData.invoiceNumber.trim();
      }

      if (isEditing && selectedBatch) {
        await batchService.updateBatch(selectedBatch.id, payload);
        toast.success('Lote actualizado exitosamente');
      } else {
        await batchService.createBatch(payload);
        toast.success('Lote creado exitosamente');
      }

      setShowFormModal(false);
      setSelectedProduct(null);
      fetchBatches();
      if (onRefresh) onRefresh(); // Notificar al padre
    } catch (error) {
      console.error('Error al guardar lote:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar lote';
      toast.error(errorMessage);
    }
  };

  const handleToggleBlock = async (batchId, currentStatus) => {
    if (!window.confirm(`¿Deseas ${currentStatus ? 'desbloquear' : 'bloquear'} este lote?`)) return;

    try {
      await batchService.toggleBlockBatch(batchId, !currentStatus);
      toast.success(`Lote ${!currentStatus ? 'bloqueado' : 'desbloqueado'}`);
      fetchBatches();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (batchId) => {
    if (!window.confirm('¿Estás seguro de eliminar este lote?')) return;

    try {
      await batchService.deleteBatch(batchId);
      toast.success('Lote eliminado exitosamente');
      fetchBatches();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Error al eliminar lote');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (batch) => {
    const expirationStatus = getExpirationStatus(batch.expirationDate);
    
    if (batch.blocked) {
      return <span className="badge-danger">🔒 Bloqueado</span>;
    }
    
    if (expirationStatus.status === 'expired') {
      return <span className="badge-danger">Vencido</span>;
    }
    
    if (expirationStatus.status === 'near_expiry') {
      return <span className="badge-warning">Por Vencer</span>;
    }
    
    if (batch.currentQuantity === 0) {
      return <span className="badge-danger">Agotado</span>;
    }
    
    return <span className="badge-success">Vigente</span>;
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Control de Lotes
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Administra lotes con alertas de vencimiento
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nuevo Lote</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </form>

          <select
            value={filters.productId}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los productos</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>

          <select
            value={filters.supplierId}
            onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="por_vencer">Por Vencer</option>
            <option value="vencido">Vencidos</option>
            <option value="bloqueado">Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Ubicación
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
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                    </div>
                  </td>
                </tr>
              ) : batches.length > 0 ? (
                batches.map((batch) => {
                  const days = daysUntilExpiration(batch.expirationDate);
                  return (
                    <tr key={batch.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-primary-600">
                          {batch.batchNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-900">
                          {batch.product?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {batch.supplier ? (
                          <span className="text-primary-600">{batch.supplier.name}</span>
                        ) : (
                          <span className="text-neutral-400 italic">Sin proveedor</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">
                            {batch.currentQuantity}
                          </p>
                          <p className="text-xs text-neutral-500">
                            de {batch.initialQuantity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm">
                            {formatDate(batch.expirationDate)}
                          </p>
                          <p className={`text-xs font-medium ${
                            days < 0 ? 'text-danger-600' :
                            days <= 30 ? 'text-warning-600' :
                            'text-success-600'
                          }`}>
                            {days < 0 ? 'Vencido' : `${days} días`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {batch.location || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(batch)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewBatch(batch.id)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                            title="Ver detalles"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleOpenForm(batch)}
                            className="p-2 text-success-600 hover:bg-success-50 rounded"
                            title="Editar"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(batch.id, batch.blocked)}
                            className="p-2 text-warning-600 hover:bg-warning-50 rounded"
                            title={batch.blocked ? 'Desbloquear' : 'Bloquear'}
                          >
                            <FiLock />
                          </button>
                          <button
                            onClick={() => handleDelete(batch.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded"
                            title="Eliminar"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    No se encontraron lotes
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
              Mostrando {batches.length} de {pagination.total} lotes
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-neutral-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {isEditing ? 'Editar Lote' : 'Nuevo Lote'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Producto *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => {
                      const productId = e.target.value;
                      setFormData({...formData, productId});
                      handleProductSelect(productId);
                    }}
                    disabled={isEditing}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      isEditing ? 'bg-neutral-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.sku}
                      </option>
                    ))}
                  </select>
                  {isEditing && (
                    <p className="text-xs text-neutral-500 mt-1">
                      No se puede cambiar el producto al editar un lote
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Proveedor
                    {selectedProduct?.supplierId && (
                      <span className="text-danger-500"> *</span>
                    )}
                    {!selectedProduct?.supplierId && (
                      <span className="text-neutral-400 text-xs ml-1">(Opcional)</span>
                    )}
                  </label>

                  {selectedProduct?.supplierId ? (
                    // Producto CON proveedor → Campo bloqueado/solo lectura
                    <>
                      <select
                        name="supplierId"
                        value={formData.supplierId}
                        required
                        disabled
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
                      >
                        <option value={selectedProduct.supplierId}>
                          {selectedProduct.supplier?.name ||
                           suppliers.find(s => s.id === selectedProduct.supplierId)?.name ||
                           `Proveedor ID: ${selectedProduct.supplierId}`}
                        </option>
                      </select>
                      <p className="text-xs text-neutral-500 mt-1">
                        🔒 El proveedor está determinado por el producto y no se puede cambiar
                      </p>
                    </>
                  ) : selectedProduct ? (
                    // Producto SIN proveedor → Campo opcional
                    <>
                      <select
                        name="supplierId"
                        value={formData.supplierId || ''}
                        onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Sin proveedor (opcional)</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-neutral-500 mt-1">
                        ℹ️ Opcional: Puedes asignar un proveedor específico para este lote o dejarlo sin proveedor
                      </p>
                    </>
                  ) : (
                    // Sin producto seleccionado todavía
                    <select
                      disabled
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 cursor-not-allowed"
                    >
                      <option value="">Selecciona primero un producto</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Número de Lote *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="LOTE-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Cantidad Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({...formData, initialQuantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha de Fabricación
                  </label>
                  <input
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({...formData, manufacturingDate: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Precio de Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Precio de Venta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Ubicación en Bodega
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Estante A-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Número de Factura/Recibo
                    <span className="text-neutral-400 ml-1">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: FACT-001"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Solo si tienes factura o recibo físico del lote
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {isEditing ? 'Actualizar' : 'Crear'} Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Detalles del Lote
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-neutral-600">Número de Lote</p>
                  <p className="text-lg font-semibold text-primary-600">{selectedBatch.batchNumber}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-neutral-600">Producto</p>
                  <p className="font-semibold">{selectedBatch.product?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Proveedor</p>
                  {selectedBatch.supplier ? (
                    <p className="font-semibold text-primary-600">{selectedBatch.supplier.name}</p>
                  ) : (
                    <p className="font-semibold text-neutral-400 italic">Sin proveedor</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Cantidad Actual</p>
                  <p className="font-semibold text-success-600">{selectedBatch.currentQuantity}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Cantidad Inicial</p>
                  <p className="font-semibold">{selectedBatch.initialQuantity}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Vendidas</p>
                  <p className="font-semibold">{selectedBatch.initialQuantity - selectedBatch.currentQuantity}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Fecha de Fabricación</p>
                  <p className="font-semibold">{formatDate(selectedBatch.manufacturingDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Fecha de Vencimiento</p>
                  <p className="font-semibold">{formatDate(selectedBatch.expirationDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Días Restantes</p>
                  <p className={`font-semibold ${
                    daysUntilExpiration(selectedBatch.expirationDate) < 0 ? 'text-danger-600' :
                    daysUntilExpiration(selectedBatch.expirationDate) <= 30 ? 'text-warning-600' :
                    'text-success-600'
                  }`}>
                    {daysUntilExpiration(selectedBatch.expirationDate)} días
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Ubicación</p>
                  <p className="font-semibold">{selectedBatch.location || 'Sin asignar'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Precio de Compra</p>
                  <p className="font-semibold">{formatCurrency(selectedBatch.purchasePrice || 0)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Precio de Venta</p>
                  <p className="font-semibold text-success-600">{formatCurrency(selectedBatch.salePrice || 0)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Factura/Recibo</p>
                  {selectedBatch.invoiceNumber ? (
                    <p className="font-semibold">{selectedBatch.invoiceNumber}</p>
                  ) : (
                    <p className="font-semibold text-neutral-400 italic">Sin factura</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Estado</p>
                  {getStatusBadge(selectedBatch)}
                </div>
              </div>

              {selectedBatch.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600 mb-2">Notas</p>
                  <p className="text-neutral-900">{selectedBatch.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-neutral-500">
                  Creado: {formatDate(selectedBatch.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesTab;
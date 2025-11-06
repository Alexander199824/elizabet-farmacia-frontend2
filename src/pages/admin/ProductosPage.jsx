/**
 * @author Alexander Echeverria
 * @file ProductosPage.jsx
 * @description Página completa de gestión de productos con CRUD
 * @location /src/pages/admin/ProductosPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiFilter, FiDownload, FiInfo } from 'react-icons/fi';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProductosPage = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    lowStock: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    genericName: '',
    category: '',
    subcategory: '',
    presentation: '',
    requiresPrescription: false,
    price: '',
    costPrice: '',
    minStock: '',
    maxStock: '',
    barcode: '',
    laboratory: '',
    activeIngredient: '',
    sideEffects: '',
    contraindications: '',
    supplierId: '',
    description: '',
    imageUrl: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true);
  const [showSKUInfo, setShowSKUInfo] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, filters]);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Generar SKU automáticamente cuando cambian los campos relevantes
  useEffect(() => {
    if (autoGenerateSKU && !editMode) {
      const generatedSKU = generateSKU(formData);
      if (generatedSKU && generatedSKU !== formData.sku) {
        setFormData(prev => ({ ...prev, sku: generatedSKU }));
      }
    }
  }, [formData.name, formData.category, formData.presentation, autoGenerateSKU, editMode]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Solo agregar parámetros si tienen valor
      if (searchTerm) params.search = searchTerm;
      if (filters.category) params.category = filters.category;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.lowStock) params.lowStock = filters.lowStock;

      const response = await productService.getAllProducts(params);

      setProducts(response.products || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await supplierService.getAllSuppliers({
        isActive: true,
        limit: 100
      });
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // No mostrar error toast para no molestar al usuario
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productService.deleteProduct(productId);
      toast.success('Producto eliminado exitosamente');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: '',
      sku: '',
      genericName: '',
      category: '',
      subcategory: '',
      presentation: '',
      requiresPrescription: false,
      price: '',
      costPrice: '',
      minStock: '',
      maxStock: '',
      barcode: '',
      laboratory: '',
      activeIngredient: '',
      sideEffects: '',
      contraindications: '',
      supplierId: '',
      description: '',
      imageUrl: '',
      isActive: true
    });
    setImageFile(null);
    setImagePreview(null);
    setAutoGenerateSKU(true); // Activar auto-generación por defecto
    setShowFormModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditMode(true);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      genericName: product.genericName || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      presentation: product.presentation || '',
      requiresPrescription: product.requiresPrescription || false,
      price: product.price || '',
      costPrice: product.costPrice || '',
      minStock: product.minStock || '',
      maxStock: product.maxStock || '',
      barcode: product.barcode || '',
      laboratory: product.laboratory || '',
      activeIngredient: product.activeIngredient || '',
      sideEffects: product.sideEffects || '',
      contraindications: product.contraindications || '',
      supplierId: product.supplierId || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setSelectedProduct(product);
    setImageFile(null);
    setImagePreview(product.imageUrl || null);
    setAutoGenerateSKU(false); // Desactivar auto-generación en modo edición
    setShowFormModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)');
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('La imagen no debe superar los 10MB');
        return;
      }

      setImageFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // Función para generar SKU automáticamente
  const generateSKU = (data) => {
    if (!data.name && !data.category) return '';

    let sku = '';

    // 1. Prefijo de categoría (3 letras)
    const categoryPrefixes = {
      'medicamento': 'MED',
      'suplemento': 'SUP',
      'cuidado_personal': 'CPR',
      'equipo_medico': 'EQM',
      'cosmetico': 'COS',
      'higiene': 'HIG',
      'bebe': 'BEB',
      'vitaminas': 'VIT',
      'primeros_auxilios': 'PAU',
      'otros': 'OTR'
    };
    const categoryPrefix = categoryPrefixes[data.category] || 'PRD';
    sku += categoryPrefix;

    // 2. Iniciales del nombre (máximo 4 letras)
    if (data.name) {
      const nameWords = data.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Eliminar caracteres especiales
        .split(' ')
        .filter(word => word.length > 0);

      if (nameWords.length > 0) {
        // Si hay múltiples palabras, tomar primera letra de cada una
        if (nameWords.length >= 2) {
          sku += '-' + nameWords.slice(0, 4).map(w => w[0]).join('');
        } else {
          // Si es una palabra, tomar primeras 4 letras
          sku += '-' + nameWords[0].substring(0, 4);
        }
      }
    }

    // 3. Código basado en presentación (opcional)
    if (data.presentation) {
      const presentationMatch = data.presentation.match(/(\d+)\s*(mg|g|ml|l|tabletas|capsulas)/i);
      if (presentationMatch) {
        sku += '-' + presentationMatch[1] + presentationMatch[2].toUpperCase().substring(0, 2);
      }
    }

    // 4. Timestamp corto para unicidad (últimos 4 dígitos)
    const timestamp = Date.now().toString().slice(-4);
    sku += '-' + timestamp;

    return sku;
  };

  const handleToggleSKUMode = () => {
    setAutoGenerateSKU(!autoGenerateSKU);
    if (!autoGenerateSKU) {
      // Si se activa el modo automático, generar SKU inmediatamente
      const generatedSKU = generateSKU(formData);
      if (generatedSKU) {
        setFormData(prev => ({ ...prev, sku: generatedSKU }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validar campos requeridos
      if (!formData.name || !formData.sku || !formData.category || !formData.price) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // Construir productData según el formato del backend
      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        minStock: parseInt(formData.minStock) || 0,
        maxStock: parseInt(formData.maxStock) || 0,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        requiresPrescription: Boolean(formData.requiresPrescription),
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.genericName) productData.genericName = formData.genericName;
      if (formData.subcategory) productData.subcategory = formData.subcategory;
      if (formData.presentation) productData.presentation = formData.presentation;
      if (formData.barcode) productData.barcode = formData.barcode;
      if (formData.laboratory) productData.laboratory = formData.laboratory;
      if (formData.activeIngredient) productData.activeIngredient = formData.activeIngredient;
      if (formData.sideEffects) productData.sideEffects = formData.sideEffects;
      if (formData.contraindications) productData.contraindications = formData.contraindications;
      if (formData.description) productData.description = formData.description;
      if (formData.imageUrl) productData.imageUrl = formData.imageUrl;

      // Para el log, crear una copia sin la imagen (para poder ver los datos en JSON)
      const productDataForLog = { ...productData };
      if (imageFile) {
        productDataForLog.image = `[File: ${imageFile.name}, ${(imageFile.size / 1024).toFixed(2)}KB]`;
      }

      console.log('📦 Datos del producto a enviar:', JSON.stringify(productDataForLog, null, 2));
      console.log('📦 Tiene imagen?:', !!imageFile);
      console.log('📦 Archivo de imagen:', imageFile);

      // Ahora SÍ agregar la imagen al productData real
      if (imageFile) {
        productData.image = imageFile;
      }

      if (editMode) {
        await productService.updateProduct(selectedProduct.id, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        const result = await productService.createProduct(productData);
        console.log('✅ Producto creado:', result);
        toast.success('Producto creado exitosamente');
      }

      setShowFormModal(false);
      fetchProducts();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error.message:', error.message);
      console.error('❌ Error.response:', error.response);
      console.error('❌ Error.response?.status:', error.response?.status);
      console.error('❌ Error.response?.data (JSON):', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error.request:', error.request);

      // Mostrar mensaje de error más detallado
      let errorMessage = 'Error al guardar el producto';

      if (error.response) {
        // El servidor respondió con un código de error
        const backendError = error.response?.data?.message
          || error.response?.data?.error
          || error.response?.data?.details
          || `Error ${error.response.status}: ${error.response.statusText}`;

        errorMessage = backendError;
        console.error('📢 Mensaje del backend:', backendError);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        // Algo pasó al configurar la petición
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStockBadge = (product) => {
    if (product.stock <= 0) {
      return <span className="badge-danger">Agotado</span>;
    }
    if (product.stock <= product.minStock) {
      return <span className="badge-warning">Stock Bajo</span>;
    }
    return <span className="badge-success">Disponible</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Gestión de Productos
          </h1>
          <p className="text-neutral-600 mt-1">
            Administra el catálogo de productos
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </form>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas las categorías</option>
            <option value="medicamento">Medicamentos</option>
            <option value="vitamina">Vitaminas</option>
            <option value="suplemento">Suplementos</option>
            <option value="cuidado_personal">Cuidado Personal</option>
            <option value="otro">Otros</option>
          </select>

          {/* Active Filter */}
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Solo stock bajo</span>
          </label>

          <button
            onClick={() => {
              setFilters({ category: '', isActive: '', lowStock: false });
              setSearchTerm('');
            }}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Total Productos</p>
          <p className="text-2xl font-bold text-primary-600">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">En Stock</p>
          <p className="text-2xl font-bold text-success-600">
            {products.filter(p => p.stock > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Stock Bajo</p>
          <p className="text-2xl font-bold text-warning-600">
            {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Agotados</p>
          <p className="text-2xl font-bold text-danger-600">
            {products.filter(p => p.stock <= 0).length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Stock
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
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-neutral-900">{product.name}</p>
                          <p className="text-sm text-neutral-500">{product.presentation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary-600">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Costo: {formatCurrency(product.costPrice)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{product.stock}</p>
                        <p className="text-xs text-neutral-500">Min: {product.minStock}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStockBadge(product)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowModal(true);
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="Ver detalles"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded"
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-neutral-500">
                    No se encontraron productos
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
              Mostrando {products.length} de {pagination.total} productos
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    pagination.page === i + 1
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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

      {/* Modal de Detalles */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Detalles del Producto</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Nombre</p>
                  <p className="font-semibold">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">SKU</p>
                  <p className="font-semibold">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Categoría</p>
                  <p className="font-semibold capitalize">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Presentación</p>
                  <p className="font-semibold">{selectedProduct.presentation}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Precio</p>
                  <p className="font-semibold text-primary-600">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Costo</p>
                  <p className="font-semibold">{formatCurrency(selectedProduct.costPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Stock Actual</p>
                  <p className="font-semibold">{selectedProduct.stock}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Stock Mínimo</p>
                  <p className="font-semibold">{selectedProduct.minStock}</p>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-neutral-600">Descripción</p>
                  <p className="text-neutral-900">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario Crear/Editar */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">
                {editMode ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nombre del Producto <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: Paracetamol 500mg"
                  />
                </div>

                {/* SKU con generación automática */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        SKU <span className="text-danger-500">*</span>
                      </label>
                      {!editMode && (
                        <button
                          type="button"
                          onClick={() => setShowSKUInfo(!showSKUInfo)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Información sobre SKU"
                        >
                          <FiInfo size={16} />
                        </button>
                      )}
                    </div>
                    {!editMode && (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoGenerateSKU}
                          onChange={handleToggleSKUMode}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-neutral-600">Auto-generar</span>
                      </label>
                    )}
                  </div>

                  {/* Panel de información del SKU */}
                  {showSKUInfo && !editMode && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        ¿Cómo se genera el SKU automáticamente?
                      </h4>
                      <div className="space-y-2 text-xs text-blue-800">
                        <div>
                          <span className="font-semibold">1. Categoría:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• Medicamento → MED</li>
                            <li>• Vitamina → VIT</li>
                            <li>• Suplemento → SUP</li>
                            <li>• Cuidado Personal → CPR</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">2. Iniciales del nombre</span>
                          <p className="ml-4 text-xs">Paracetamol → PARA</p>
                        </div>
                        <div>
                          <span className="font-semibold">3. Dosis (si aplica)</span>
                          <p className="ml-4 text-xs">500mg → 500MG</p>
                        </div>
                        <div>
                          <span className="font-semibold">4. Código único</span>
                          <p className="ml-4 text-xs">Timestamp de 4 dígitos</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-300">
                          <span className="font-semibold">Ejemplos:</span>
                          <ul className="ml-4 mt-1 space-y-1 font-mono text-xs">
                            <li>• MED-PARA-500MG-8234</li>
                            <li>• VIT-C-1000MG-9123</li>
                            <li>• SUP-OMEGA-3-4567</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleFormChange}
                    required
                    disabled={autoGenerateSKU && !editMode}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      autoGenerateSKU && !editMode ? 'bg-neutral-100 cursor-not-allowed' : ''
                    }`}
                    placeholder={autoGenerateSKU ? 'Se generará automáticamente...' : 'Ej: MED-001'}
                  />
                  {autoGenerateSKU && !editMode && formData.sku && (
                    <p className="text-xs text-success-600 mt-1">
                      ✓ SKU generado automáticamente
                    </p>
                  )}
                  {autoGenerateSKU && !editMode && (
                    <div className="mt-2 p-2 bg-primary-50 rounded border border-primary-200">
                      <p className="text-xs text-primary-700">
                        <strong>Formato:</strong> CATEGORÍA-INICIALES-DOSIS-CÓDIGO
                      </p>
                      <p className="text-xs text-primary-600 mt-1">
                        Ejemplo: MED-PARA-500MG-1234
                      </p>
                    </div>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Categoría <span className="text-danger-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="medicamento">Medicamento</option>
                    <option value="suplemento">Suplemento</option>
                    <option value="cuidado_personal">Cuidado Personal</option>
                    <option value="equipo_medico">Equipo Médico</option>
                    <option value="cosmetico">Cosmético</option>
                    <option value="higiene">Higiene</option>
                    <option value="bebe">Bebé</option>
                    <option value="vitaminas">Vitaminas</option>
                    <option value="primeros_auxilios">Primeros Auxilios</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Presentación */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Presentación
                  </label>
                  <input
                    type="text"
                    name="presentation"
                    value={formData.presentation}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: Caja x 20 tabletas"
                  />
                </div>

                {/* Proveedor (Opcional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Proveedor <span className="text-neutral-400 text-xs">(Opcional)</span>
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Sin proveedor asignado</option>
                    {loadingSuppliers ? (
                      <option disabled>Cargando proveedores...</option>
                    ) : suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay proveedores disponibles</option>
                    )}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Puedes asignar un proveedor ahora o dejarlo en blanco para agregarlo después
                  </p>
                </div>

                {/* Precio de Venta */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Precio de Venta <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Precio de Costo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Precio de Costo
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Stock Máximo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    name="maxStock"
                    value={formData.maxStock}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Subcategoría (Opcional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Subcategoría <span className="text-neutral-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: analgésicos, antibióticos"
                  />
                </div>

                {/* Requiere Receta */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleFormChange}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label className="text-sm font-medium text-neutral-700">
                    ¿Requiere Receta Médica?
                  </label>
                </div>

                {/* Imagen del Producto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Imagen del Producto
                  </label>

                  {/* Preview de la imagen */}
                  {imagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-neutral-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-danger-600"
                        title="Eliminar imagen"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Input de archivo */}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1">
                      <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-1 text-sm text-neutral-600">
                            <span className="font-semibold text-primary-600">Click para subir</span> o arrastra la imagen
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            PNG, JPG, GIF, WEBP hasta 5MB
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Opción de URL (alternativa) */}
                  <div className="mt-3">
                    <p className="text-xs text-neutral-500 mb-2">O proporciona una URL de imagen:</p>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      disabled={!!imageFile}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Descripción del producto..."
                  />
                </div>

                {/* Estado Activo */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      Producto Activo
                    </span>
                  </label>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2"
                >
                  {editMode ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPage;
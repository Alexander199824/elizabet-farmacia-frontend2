/**
 * @author Alexander Echeverria
 * @file ProveedoresPage.jsx
 * @description Página completa de gestión de proveedores con CRUD
 * @location /src/pages/admin/ProveedoresPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiPhone,
  FiMail, FiMapPin, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import QuetzalIcon from '../../components/common/QuetzalIcon';
import supplierService from '../../services/supplierService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProveedoresPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    alternativePhone: '',
    address: '',
    nit: '',
    acceptsReturns: true,
    returnPolicyMonthsBefore: 3,
    returnPolicyMonthsAfter: '',
    returnConditions: '',
    paymentTerms: '',
    creditLimit: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  const [showCodeInfo, setShowCodeInfo] = useState(false);

  // Función para generar código de proveedor automáticamente
  const generateSupplierCode = (name) => {
    // Validar que name sea un string válido
    if (!name || typeof name !== 'string') return '';

    const trimmedName = name.trim();
    if (!trimmedName) return '';

    let code = 'PROV';

    // Obtener iniciales del nombre (máximo 4 letras)
    const nameWords = trimmedName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Eliminar caracteres especiales
      .split(' ')
      .filter(word => word.length > 0);

    if (nameWords.length > 0) {
      if (nameWords.length >= 2) {
        // Si hay múltiples palabras: tomar primera letra de cada una (máx 4)
        code += '-' + nameWords.slice(0, 4).map(w => w[0]).join('');
      } else {
        // Si es una palabra: tomar primeras 4 letras
        code += '-' + nameWords[0].substring(0, 4);
      }
    }

    // Agregar timestamp único (últimos 4 dígitos)
    const timestamp = Date.now().toString().slice(-4);
    code += '-' + timestamp;

    return code;
  };

  // Generar código automáticamente cuando cambia el nombre
  useEffect(() => {
    if (autoGenerateCode && !isEditing) {
      if (formData.name && formData.name.trim()) {
        const generatedCode = generateSupplierCode(formData.name);
        console.log('🔄 Generando código:', generatedCode, 'para el nombre:', formData.name);
        if (generatedCode) {
          setFormData(prev => ({ ...prev, code: generatedCode }));
        }
      } else {
        // Limpiar código si no hay nombre
        if (formData.code) {
          console.log('🧹 Limpiando código porque no hay nombre');
          setFormData(prev => ({ ...prev, code: '' }));
        }
      }
    }
  }, [formData.name, autoGenerateCode, isEditing]);

  useEffect(() => {
    fetchSuppliers();
  }, [pagination.page, filters]);

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSuppliers();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Solo agregar parámetros si tienen valor
      if (searchTerm) params.search = searchTerm;
      if (filters.isActive !== '') params.isActive = filters.isActive;

      const response = await supplierService.getAllSuppliers(params);
      
      setSuppliers(response.suppliers || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSuppliers();
  };

  const handleViewSupplier = async (supplierId) => {
    try {
      const response = await supplierService.getSupplierById(supplierId);
      setSelectedSupplier(response);
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  const handleOpenForm = (supplier = null) => {
    if (supplier) {
      setFormData({
        code: supplier.code || '',
        name: supplier.name || '',
        contactName: supplier.contactName || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        alternativePhone: supplier.alternativePhone || '',
        address: supplier.address || '',
        nit: supplier.nit || '',
        acceptsReturns: supplier.acceptsReturns !== undefined ? supplier.acceptsReturns : true,
        returnPolicyMonthsBefore: supplier.returnPolicyMonthsBefore || 3,
        returnPolicyMonthsAfter: supplier.returnPolicyMonthsAfter || '',
        returnConditions: supplier.returnConditions || '',
        paymentTerms: supplier.paymentTerms || '',
        creditLimit: supplier.creditLimit || '',
        notes: supplier.notes || ''
      });
      setIsEditing(true);
      setSelectedSupplier(supplier);
      setAutoGenerateCode(false); // Desactivar auto-generación en modo edición
    } else {
      setFormData({
        code: '',
        name: '',
        contactName: '',
        email: '',
        phone: '',
        alternativePhone: '',
        address: '',
        nit: '',
        acceptsReturns: true,
        returnPolicyMonthsBefore: 3,
        returnPolicyMonthsAfter: '',
        returnConditions: '',
        paymentTerms: '',
        creditLimit: '',
        notes: ''
      });
      setIsEditing(false);
      setSelectedSupplier(null);
      setAutoGenerateCode(true); // Activar auto-generación para nuevos proveedores
    }
    setShowFormModal(true);
  };

  const handleToggleCodeMode = () => {
    const newAutoGenerateState = !autoGenerateCode;
    setAutoGenerateCode(newAutoGenerateState);
    if (newAutoGenerateState && formData.name) {
      // Si se activa el modo automático, generar código inmediatamente
      const generatedCode = generateSupplierCode(formData.name);
      console.log('🔀 Toggle mode - Generando código:', generatedCode);
      if (generatedCode) {
        setFormData(prev => ({ ...prev, code: generatedCode }));
      }
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      // Validaciones adicionales
      if (!formData.code?.trim()) {
        toast.error('El código del proveedor es obligatorio');
        return;
      }
      if (!formData.name?.trim()) {
        toast.error('El nombre del proveedor es obligatorio');
        return;
      }
      if (!formData.phone?.trim()) {
        toast.error('El teléfono es obligatorio');
        return;
      }

      // Preparar datos - solo incluir campos con valores
      const preparedData = {
        code: formData.code?.trim() || '',
        name: formData.name?.trim() || '',
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '', // Backend requiere email, enviamos string vacío si no hay valor
        acceptsReturns: formData.acceptsReturns,
        returnPolicyMonthsBefore: formData.returnPolicyMonthsBefore === '' || formData.returnPolicyMonthsBefore === null ? 3 : parseInt(formData.returnPolicyMonthsBefore) || 3,
        returnPolicyMonthsAfter: formData.returnPolicyMonthsAfter === '' || formData.returnPolicyMonthsAfter === null ? 0 : parseInt(formData.returnPolicyMonthsAfter) || 0,
        creditLimit: formData.creditLimit === '' || formData.creditLimit === null ? 0 : parseFloat(formData.creditLimit) || 0
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.contactName?.trim()) {
        preparedData.contactName = formData.contactName.trim();
      }
      if (formData.alternativePhone?.trim()) {
        preparedData.alternativePhone = formData.alternativePhone.trim();
      }
      if (formData.address?.trim()) {
        preparedData.address = formData.address.trim();
      }
      if (formData.nit?.trim()) {
        preparedData.nit = formData.nit.trim();
      }
      if (formData.returnConditions?.trim()) {
        preparedData.returnConditions = formData.returnConditions.trim();
      }
      if (formData.paymentTerms?.trim()) {
        preparedData.paymentTerms = formData.paymentTerms.trim();
      }
      if (formData.notes?.trim()) {
        preparedData.notes = formData.notes.trim();
      }

      // Remover code si está editando
      const dataToSend = isEditing
        ? { ...preparedData, code: undefined }
        : preparedData;

      console.log('Datos a enviar:', dataToSend);

      if (isEditing && selectedSupplier) {
        await supplierService.updateSupplier(selectedSupplier.id, dataToSend);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await supplierService.createSupplier(dataToSend);
        toast.success('Proveedor creado exitosamente');
      }

      setShowFormModal(false);
      fetchSuppliers();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Tipo de error:', typeof error);

      // Extraer mensaje de error más detallado
      let errorMessage = 'Error al guardar proveedor';

      // El servicio lanza error.response.data directamente, no el error completo
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.msg) {
          errorMessage = error.msg;
        }
      }

      console.error('📢 Mensaje de error:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (supplierId) => {
    try {
      await supplierService.toggleActive(supplierId);
      toast.success('Estado actualizado');
      fetchSuppliers();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      await supplierService.deleteSupplier(supplierId);
      toast.success('Proveedor eliminado exitosamente');
      fetchSuppliers();
    } catch (error) {
      toast.error('Error al eliminar proveedor');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Gestión de Proveedores
          </h1>
          <p className="text-neutral-600 mt-1">
            Administra tus proveedores
          </p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, NIT, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </form>

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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Total Proveedores</p>
          <p className="text-2xl font-bold text-primary-600">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Activos</p>
          <p className="text-2xl font-bold text-success-600">
            {suppliers.filter(s => s.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Inactivos</p>
          <p className="text-2xl font-bold text-danger-600">
            {suppliers.filter(s => !s.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-neutral-600">Con Deuda</p>
          <p className="text-2xl font-bold text-warning-600">
            {suppliers.filter(s => s.currentDebt > 0).length}
          </p>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  NIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Deuda Actual
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
              ) : suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-semibold text-primary-600">
                        {supplier.code}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">{supplier.name}</p>
                      <p className="text-sm text-neutral-500">{supplier.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {supplier.contactName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {supplier.nit || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${supplier.currentDebt > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                        {formatCurrency(supplier.currentDebt || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {supplier.isActive ? (
                        <span className="badge-success">Activo</span>
                      ) : (
                        <span className="badge-danger">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSupplier(supplier.id)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="Ver detalles"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleOpenForm(supplier)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleToggleActive(supplier.id)}
                          className="p-2 text-warning-600 hover:bg-warning-50 rounded"
                          title={supplier.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {supplier.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    No se encontraron proveedores
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
              Mostrando {suppliers.length} de {pagination.total} proveedores
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Panel informativo fuera del grid */}
              {showCodeInfo && !isEditing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs mb-4">
                  <h5 className="font-semibold text-blue-900 mb-2">
                    ¿Cómo se genera el código automáticamente?
                  </h5>
                  <div className="space-y-2 text-blue-800">
                    <div>
                      <span className="font-medium">1. Prefijo fijo:</span>
                      <p className="ml-4">• PROV (Proveedor)</p>
                    </div>
                    <div>
                      <span className="font-medium">2. Iniciales del nombre:</span>
                      <p className="ml-4">• Si hay múltiples palabras: primera letra de cada una (máx 4)</p>
                      <p className="ml-4">• Si es una palabra: primeras 4 letras</p>
                    </div>
                    <div>
                      <span className="font-medium">3. Código único:</span>
                      <p className="ml-4">• Timestamp de 4 dígitos</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-300">
                      <span className="font-medium">Ejemplos:</span>
                      <p className="ml-4">• "Farmacéutica ABC" → PROV-FABC-1234</p>
                      <p className="ml-4">• "Distribuidora Guatemala" → PROV-DG-5678</p>
                      <p className="ml-4">• "Laboratorios" → PROV-LABO-9012</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Código del Proveedor *
                    </label>
                    {!isEditing && (
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoGenerateCode}
                            onChange={handleToggleCodeMode}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs text-neutral-600">Auto-generar</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCodeInfo(!showCodeInfo)}
                          className="text-primary-600 hover:text-primary-700 text-xs underline"
                        >
                          ¿Cómo funciona?
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    disabled={isEditing || (autoGenerateCode && !isEditing)}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      (isEditing || autoGenerateCode) ? 'bg-neutral-100 cursor-not-allowed' : ''
                    }`}
                    placeholder={autoGenerateCode && !isEditing ? 'Se generará automáticamente...' : 'PROV-ABC-1234'}
                  />
                  {isEditing && (
                    <p className="text-xs text-neutral-500 mt-1">
                      El código no se puede modificar
                    </p>
                  )}
                  {!isEditing && autoGenerateCode && formData.name && (
                    <p className="text-xs text-success-600 mt-1">
                      ✓ Código generado automáticamente
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Distribuidora XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    NIT
                  </label>
                  <input
                    type="text"
                    value={formData.nit}
                    onChange={(e) => setFormData({...formData, nit: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="12345678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email <span className="text-neutral-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="contacto@proveedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Teléfono Alternativo
                  </label>
                  <input
                    type="tel"
                    value={formData.alternativePhone}
                    onChange={(e) => setFormData({...formData, alternativePhone: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="5678-9012"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Zona 10, Ciudad de Guatemala"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Términos de Pago
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="30 días"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Límite de Crédito
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Políticas de Devolución */}
                <div className="col-span-2 pt-4 border-t">
                  <h4 className="text-md font-semibold text-neutral-800 mb-4">
                    Políticas de Devolución
                  </h4>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.acceptsReturns}
                      onChange={(e) => setFormData({...formData, acceptsReturns: e.target.checked})}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      Acepta devoluciones
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Meses antes de vencimiento
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.returnPolicyMonthsBefore}
                    onChange={(e) => setFormData({...formData, returnPolicyMonthsBefore: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Meses después de vencimiento
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.returnPolicyMonthsAfter}
                    onChange={(e) => setFormData({...formData, returnPolicyMonthsAfter: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Condiciones de Devolución
                  </label>
                  <textarea
                    value={formData.returnConditions}
                    onChange={(e) => setFormData({...formData, returnConditions: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="2"
                    placeholder="Productos en buen estado, empaque original..."
                  />
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
                  {isEditing ? 'Actualizar' : 'Crear'} Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Detalles del Proveedor
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
                <div>
                  <p className="text-sm text-neutral-600">Código</p>
                  <p className="text-lg font-mono font-semibold text-primary-600">
                    {selectedSupplier.code}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-600">Nombre</p>
                  <p className="text-lg font-semibold">{selectedSupplier.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Contacto</p>
                  <p className="font-semibold">{selectedSupplier.contactName || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">NIT</p>
                  <p className="font-semibold">{selectedSupplier.nit || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-semibold">{selectedSupplier.email || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Teléfono</p>
                  <p className="font-semibold">{selectedSupplier.phone || '-'}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-neutral-600">Dirección</p>
                  <p className="font-semibold">{selectedSupplier.address || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Términos de Pago</p>
                  <p className="font-semibold">{selectedSupplier.paymentTerms || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Límite de Crédito</p>
                  <p className="font-semibold text-primary-600">
                    {formatCurrency(selectedSupplier.creditLimit || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Deuda Actual</p>
                  <p className={`font-semibold ${selectedSupplier.currentDebt > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                    {formatCurrency(selectedSupplier.currentDebt || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Estado</p>
                  <span className={selectedSupplier.isActive ? 'badge-success' : 'badge-danger'}>
                    {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {selectedSupplier.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600 mb-2">Notas</p>
                  <p className="text-neutral-900">{selectedSupplier.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-neutral-500">
                  Creado: {formatDate(selectedSupplier.createdAt)}
                </p>
              </div>

              <div className="pt-4 border-t flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleOpenForm(selectedSupplier);
                  }}
                  className="btn-primary"
                >
                  <FiEdit2 className="mr-2" />
                  Editar
                </button>
                {selectedSupplier.phone && (
                  <a href={`tel:${selectedSupplier.phone}`} className="btn-outline">
                    <FiPhone className="mr-2" />
                    Llamar
                  </a>
                )}
                {selectedSupplier.email && (
                  <a href={`mailto:${selectedSupplier.email}`} className="btn-outline">
                    <FiMail className="mr-2" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresPage;
/**
 * @author Alexander Echeverria
 * @file UsuariosPage.jsx
 * @description Página completa de gestión de usuarios con CRUD
 * @location /src/pages/admin/UsuariosPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';
import toast from 'react-hot-toast';

const UsuariosPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    dpi: '',
    nit: '',
    address: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.page, filters]);

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Solo agregar parámetros si tienen valor
      if (searchTerm) params.search = searchTerm;
      if (filters.role) params.role = filters.role;
      if (filters.isActive !== '') params.isActive = filters.isActive;

      const response = await userService.getAllUsers(params);
      
      setUsers(response.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleActive = async (userId) => {
    try {
      await userService.toggleActive(userId);
      toast.success('Estado actualizado');
      fetchUsers();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await userService.deleteUser(userId);
      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      phone: '',
      dpi: '',
      nit: '',
      address: '',
      isActive: true
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditMode(true);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '', // No se envía la contraseña en edición
      role: user.role || '',
      phone: user.phone || '',
      dpi: user.dpi || '',
      nit: user.nit || '',
      address: user.address || '',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setSelectedUser(user);
    setShowFormModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validar campos requeridos
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // Si es creación, validar contraseña
      if (!editMode && !formData.password) {
        toast.error('La contraseña es requerida para nuevos usuarios');
        return;
      }

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        dpi: formData.dpi,
        nit: formData.nit,
        address: formData.address,
        isActive: formData.isActive
      };

      // Solo incluir password si no es edición o si se proporcionó una nueva
      if (!editMode) {
        userData.password = formData.password;
      }

      if (editMode) {
        await userService.updateUser(selectedUser.id, userData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await userService.createUser(userData);
        toast.success('Usuario creado exitosamente');
      }

      setShowFormModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Error al guardar el usuario');
    }
  };

  // Manejador específico para cambiar rol
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) {
      return;
    }

    try {
      await userService.changeUserRole(userId, newRole);
      toast.success(`Rol cambiado a ${newRole} exitosamente`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Error al cambiar el rol');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-700',
      vendedor: 'bg-blue-100 text-blue-700',
      bodega: 'bg-yellow-100 text-yellow-700',
      repartidor: 'bg-green-100 text-green-700',
      cliente: 'bg-neutral-100 text-neutral-700'
    };
    return badges[role] || badges.cliente;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Gestión de Usuarios
          </h1>
          <p className="text-neutral-600 mt-1">
            Administra usuarios del sistema
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </form>

          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los roles</option>
            <option value={USER_ROLES.ADMIN}>Administrador</option>
            <option value={USER_ROLES.VENDEDOR}>Vendedor</option>
            <option value={USER_ROLES.BODEGA}>Bodega</option>
            <option value={USER_ROLES.REPARTIDOR}>Repartidor</option>
            <option value={USER_ROLES.CLIENTE}>Cliente</option>
          </select>

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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Total Usuarios</p>
            <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Activos</p>
            <p className="text-2xl font-bold text-success-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Inactivos</p>
            <p className="text-2xl font-bold text-danger-600">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Con Google</p>
            <p className="text-2xl font-bold text-blue-600">{stats.withGoogle}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-neutral-600">Logins Recientes</p>
            <p className="text-2xl font-bold text-purple-600">{stats.recentLogins}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Teléfono
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
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-neutral-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${getRoleBadge(user.role)}`}
                      >
                        <option value={USER_ROLES.ADMIN}>👑 Administrador</option>
                        <option value={USER_ROLES.VENDEDOR}>💼 Vendedor</option>
                        <option value={USER_ROLES.BODEGA}>📦 Bodega</option>
                        <option value={USER_ROLES.REPARTIDOR}>🚚 Repartidor</option>
                        <option value={USER_ROLES.CLIENTE}>👤 Cliente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="badge-success">Activo</span>
                      ) : (
                        <span className="badge-danger">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="Ver detalles"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className="p-2 text-warning-600 hover:bg-warning-50 rounded"
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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
                  <td colSpan="6" className="px-6 py-8 text-center text-neutral-500">
                    No se encontraron usuarios
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
              Mostrando {users.length} de {pagination.total} usuarios
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

      {/* Modal de Detalles */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Detalles del Usuario</h3>
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
                  <p className="text-sm text-neutral-600">Nombre</p>
                  <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Rol</p>
                  <p className="font-semibold capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Teléfono</p>
                  <p className="font-semibold">{selectedUser.phone || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">DPI</p>
                  <p className="font-semibold">{selectedUser.dpi || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">NIT</p>
                  <p className="font-semibold">{selectedUser.nit || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Estado</p>
                  <p className="font-semibold">
                    {selectedUser.isActive ? '✅ Activo' : '❌ Inactivo'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Email Verificado</p>
                  <p className="font-semibold">
                    {selectedUser.emailVerified ? '✅ Verificado' : '⏳ Pendiente'}
                  </p>
                </div>
              </div>
              {selectedUser.address && (
                <div>
                  <p className="text-sm text-neutral-600">Dirección</p>
                  <p className="text-neutral-900">{selectedUser.address}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-neutral-600">Creado</p>
                <p className="text-neutral-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
              </div>
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
                {editMode ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nombre <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Apellido <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Pérez"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                {/* Contraseña (solo al crear) */}
                {!editMode && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Contraseña <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required={!editMode}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                      minLength="6"
                    />
                  </div>
                )}

                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rol <span className="text-danger-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value={USER_ROLES.ADMIN}>Administrador</option>
                    <option value={USER_ROLES.VENDEDOR}>Vendedor</option>
                    <option value={USER_ROLES.BODEGA}>Bodega</option>
                    <option value={USER_ROLES.REPARTIDOR}>Repartidor</option>
                    <option value={USER_ROLES.CLIENTE}>Cliente</option>
                  </select>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1234-5678"
                  />
                </div>

                {/* DPI */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    DPI
                  </label>
                  <input
                    type="text"
                    name="dpi"
                    value={formData.dpi}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1234567890101"
                  />
                </div>

                {/* NIT */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    NIT
                  </label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="12345678-9"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Dirección completa del usuario..."
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
                      Usuario Activo
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
                  {editMode ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
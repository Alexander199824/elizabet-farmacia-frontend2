/**
 * @author Alexander Echeverria
 * @file MiPerfilPage.jsx
 * @description Página de perfil del cliente para editar sus datos
 * @location /src/pages/cliente/MiPerfilPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiEdit2, FiLock, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import toast from 'react-hot-toast';

const MiPerfilPage = () => {
  // Helper para formatear fecha para mostrar
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No especificado';

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-GT', options);
  };
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dpi: '',
    birthDate: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      // Formatear birthDate si existe (de ISO a YYYY-MM-DD para el input date)
      let formattedBirthDate = '';
      if (user.birthDate) {
        const date = new Date(user.birthDate);
        if (!isNaN(date.getTime())) {
          formattedBirthDate = date.toISOString().split('T')[0];
        }
      }

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dpi: user.dpi || '',
        birthDate: formattedBirthDate,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos para enviar
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        dpi: formData.dpi,
        birthDate: formData.birthDate,
      };

      // Llamar al servicio para actualizar el perfil
      const response = await userService.updateProfile(dataToSend);

      // Actualizar el contexto con los nuevos datos
      if (updateUser && response.user) {
        updateUser(response.user);
      }

      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Formatear birthDate si existe
    let formattedBirthDate = '';
    if (user.birthDate) {
      const date = new Date(user.birthDate);
      if (!isNaN(date.getTime())) {
        formattedBirthDate = date.toISOString().split('T')[0];
      }
    }

    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      dpi: user.dpi || '',
      birthDate: formattedBirthDate,
    });
    setIsEditing(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">Mi Perfil</h1>
          <p className="text-neutral-600 mt-2">
            Administra tu información personal
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiEdit2 />
            <span>Editar Perfil</span>
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {/* Header con Avatar */}
        <div className="bg-gradient-to-r from-primary-600 to-success-600 p-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-lg opacity-90">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                Cliente
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <FiUser className="text-primary-600" />
              <span>Información Personal</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <FiMail className="text-primary-600" />
              <span>Información de Contacto</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10"
                    placeholder="Ej: 70707070"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dirección y Datos Adicionales */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <FiMapPin className="text-primary-600" />
              <span>Dirección y Datos Adicionales</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Dirección en Rabinal, Baja Verapaz
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field"
                  placeholder="Ej: Barrio El Centro, frente al parque central"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Indicar barrio, referencias o puntos conocidos
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                    <FiCreditCard className="text-primary-600" />
                    <span>DPI (opcional)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="dpi"
                      value={formData.dpi}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="1234567890101"
                      maxLength={13}
                    />
                  ) : (
                    <div className="input-field bg-neutral-50">
                      {formData.dpi || 'No especificado'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                    <FiCalendar className="text-primary-600" />
                    <span>Fecha de Nacimiento (opcional)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <div className="input-field bg-neutral-50">
                      {formatDisplayDate(formData.birthDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          {isEditing && (
            <div className="flex items-center space-x-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <FiSave />
                <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn-outline"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <FiLock className="text-primary-600" />
          <span>Seguridad</span>
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <p className="font-medium flex items-center space-x-2">
              <FiLock />
              <span>Cambiar Contraseña</span>
            </p>
            <p className="text-sm text-neutral-600">Actualiza tu contraseña de forma segura</p>
          </button>
        </div>
      </div>

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <FiLock className="text-primary-600" />
                  <span>Cambiar Contraseña</span>
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="input-field"
                  required
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="input-field"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input-field"
                  required
                  minLength={8}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={loading}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiPerfilPage;

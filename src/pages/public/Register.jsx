/**
 * @author Alexander Echeverria
 * @file Register.jsx
 * @description Página de registro de usuarios
 * @location /src/pages/public/Register.jsx
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiAlertCircle } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { FARMACIA_INFO } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const Register = () => {
  const navigate = useNavigate();
  const { register, registerWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    // Email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Phone (opcional pero si se ingresa, validar)
    if (formData.phone && formData.phone.length < 8) {
      newErrors.phone = 'El teléfono debe tener al menos 8 dígitos';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: 'cliente',
        isActive: true, // Asegurar que el usuario se registre como activo
      };

      await register(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Register error:', error);
      setErrors({ 
        submit: error.message || 'Error al registrarse. Intenta nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await registerWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google register error:', error);
      setErrors({ 
        submit: 'Error al registrarse con Google. Intenta nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ 
      submit: 'Error al conectar con Google. Intenta nuevamente.' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-success-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              FE
            </div>
          </Link>
          <h2 className="text-3xl font-display font-bold text-neutral-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-neutral-600">
            Únete a {FARMACIA_INFO.name}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error general */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
              <FiAlertCircle className="text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-700">{errors.submit}</p>
            </div>
          )}

          {/* Google Register */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signup_with"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">O regístrate con email</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-neutral-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`
                      block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm
                      focus:outline-none focus:ring-2 transition-colors
                      ${errors.firstName 
                        ? 'border-danger-300 focus:ring-danger-500' 
                        : 'border-neutral-300 focus:ring-primary-500'
                      }
                    `}
                    placeholder="Juan"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-danger-600">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`
                    block w-full px-3 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 transition-colors
                    ${errors.lastName 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-neutral-300 focus:ring-primary-500'
                    }
                  `}
                  placeholder="Pérez"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-danger-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`
                    block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 transition-colors
                    ${errors.email 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-neutral-300 focus:ring-primary-500'
                    }
                  `}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger-600">{errors.email}</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Teléfono <span className="text-neutral-400">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="text-neutral-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`
                    block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 transition-colors
                    ${errors.phone 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-neutral-300 focus:ring-primary-500'
                    }
                  `}
                  placeholder="12345678"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-danger-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`
                    block w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 transition-colors
                    ${errors.password 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-neutral-300 focus:ring-primary-500'
                    }
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`
                    block w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 transition-colors
                    ${errors.confirmPassword 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-neutral-300 focus:ring-primary-500'
                    }
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 mt-0.5 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-neutral-700">
                Acepto los{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  política de privacidad
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader size="small" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear Cuenta</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
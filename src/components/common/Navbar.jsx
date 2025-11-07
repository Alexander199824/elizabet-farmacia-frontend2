/**
 * @author Alexander Echeverria
 * @file Navbar.jsx
 * @description Barra de navegación principal
 * @location /src/components/common/Navbar.jsx
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FARMACIA_INFO } from '../../utils/constants';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount, toggleCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartItemsCount = getCartItemsCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-primary-600 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span>📞 {FARMACIA_INFO.phone}</span>
              <span>📧 {FARMACIA_INFO.email}</span>
            </div>
            <div>
              <span>📍 {FARMACIA_INFO.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-success-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              FE
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-primary-600">
                {FARMACIA_INFO.name}
              </h1>
              <p className="text-xs text-neutral-500">Tu salud es primero</p>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-3 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <FiShoppingCart className="text-2xl text-neutral-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <FiUser />
                  <span className="font-medium">{user.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-3 hover:bg-neutral-100 rounded-lg transition-colors text-danger-500"
                >
                  <FiLogOut className="text-xl" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-outline">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-primary">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
          >
            {isMenuOpen ? (
              <FiX className="text-2xl" />
            ) : (
              <FiMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t animate-slide-down">
            {/* Mobile links */}
            <div className="space-y-2">
              <button
                onClick={toggleCart}
                className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FiShoppingCart className="text-xl" />
                  <span>Carrito</span>
                </div>
                {cartItemsCount > 0 && (
                  <span className="bg-danger-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiUser className="text-xl" />
                    <span>{user.firstName}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg text-danger-500"
                  >
                    <FiLogOut className="text-xl" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full btn-outline block text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="w-full btn-primary block text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

/**
 * Componente de campanita de notificaciones
 * Muestra el badge con el conteo de notificaciones no leídas
 * y abre el dropdown con las notificaciones al hacer clic
 */
const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <FiBell className="text-xl text-neutral-700" />

        {/* Badge con el conteo de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-danger-500 text-white text-xs font-semibold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Indicador de pulso cuando hay notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

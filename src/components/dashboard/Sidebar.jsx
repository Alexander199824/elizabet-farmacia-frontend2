/**
 * @author Alexander Echeverria
 * @file Sidebar.jsx
 * @description Sidebar del dashboard con todas las opciones
 * ✅ BODEGA ahora tiene acceso a Productos y Lotes
 * @location /src/components/dashboard/Sidebar.jsx
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiShoppingCart, FiUsers, FiTruck, 
  FiBarChart2, FiSettings, FiLogOut, FiFileText, FiBox,
  FiDollarSign, FiCalendar, FiUser, FiActivity, FiLayers,
  FiInbox
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { FARMACIA_INFO, USER_ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menús según rol
  const menuByRole = {
    [USER_ROLES.ADMIN]: [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/dashboard/productos', icon: FiPackage, label: 'Productos' },
      { path: '/dashboard/ventas', icon: FiShoppingCart, label: 'Ventas' },
      { path: '/dashboard/usuarios', icon: FiUsers, label: 'Usuarios' },
      { path: '/dashboard/inventario', icon: FiBox, label: 'Inventario' },
      { path: '/dashboard/proveedores', icon: FiLayers, label: 'Proveedores' },
      { path: '/dashboard/auditoria', icon: FiActivity, label: 'Auditoría' },
      { path: '/dashboard/reportes', icon: FiBarChart2, label: 'Reportes' },
      { path: '/dashboard/configuracion', icon: FiSettings, label: 'Configuración' },
    ],
    [USER_ROLES.VENDEDOR]: [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/dashboard/nueva-venta', icon: FiShoppingCart, label: 'Nueva Venta' },
      { path: '/dashboard/mis-ventas', icon: FiFileText, label: 'Mis Ventas' },
      { path: '/dashboard/productos', icon: FiPackage, label: 'Productos' },
      { path: '/dashboard/clientes', icon: FiUsers, label: 'Clientes' },
    ],
    // ✅ MENÚ DE BODEGA MEJORADO
    [USER_ROLES.BODEGA]: [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/dashboard/productos', icon: FiPackage, label: 'Productos' }, // ✅ NUEVO
      { path: '/dashboard/lotes', icon: FiInbox, label: 'Lotes' }, // ✅ MEJORADO
      { path: '/dashboard/inventario', icon: FiBox, label: 'Inventario' },
      { path: '/dashboard/proveedores', icon: FiLayers, label: 'Proveedores' },
      { path: '/dashboard/entradas', icon: FiDollarSign, label: 'Entradas' },
      { path: '/dashboard/alertas', icon: FiCalendar, label: 'Alertas Stock' },
    ],
    [USER_ROLES.REPARTIDOR]: [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/dashboard/entregas', icon: FiTruck, label: 'Mis Entregas' },
      { path: '/dashboard/ruta', icon: FiCalendar, label: 'Ruta del Día' },
      { path: '/dashboard/historial', icon: FiFileText, label: 'Historial' },
    ],
    [USER_ROLES.CLIENTE]: [
      { path: '/dashboard', icon: FiHome, label: 'Mi Cuenta' },
      { path: '/dashboard/compras', icon: FiShoppingCart, label: 'Hacer Compras' },
      { path: '/dashboard/pedidos', icon: FiPackage, label: 'Mis Pedidos' },
      { path: '/dashboard/recibos', icon: FiFileText, label: 'Mis Recibos' },
      { path: '/dashboard/perfil', icon: FiUser, label: 'Mi Perfil' },
    ],
  };

  const menuItems = menuByRole[user?.role] || [];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b bg-gradient-to-r from-primary-600 to-success-600">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 font-bold">
              FE
            </div>
            <div className="text-white">
              <h2 className="font-bold text-sm">{FARMACIA_INFO.name}</h2>
              <p className="text-xs opacity-90">Panel {user?.role}</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-neutral-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary-50 text-primary-600 font-semibold' 
                        : 'text-neutral-700 hover:bg-neutral-100'
                      }
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                  >
                    <Icon className="text-xl flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <FiLogOut className="text-xl" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
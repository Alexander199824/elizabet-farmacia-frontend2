/**
 * @author Alexander Echeverria
 * @file DashboardHeader.jsx
 * @description Header del dashboard
 * @location /src/components/dashboard/DashboardHeader.jsx
 */

import { FiMenu, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const DashboardHeader = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-6">
      {/* Left: Menu + Search */}
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <FiMenu className="text-2xl text-neutral-700" />
        </button>

        <div className="hidden md:flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User info */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
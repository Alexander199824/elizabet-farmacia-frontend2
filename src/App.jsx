/**
 * @author Alexander Echeverria
 * @file App.jsx
 * @description Componente principal con TODAS las rutas funcionando
 * ✅ BODEGA puede crear/editar productos y lotes
 * @location /src/App.jsx
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { USER_ROLES } from './utils/constants';

// Layouts
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Checkout from './pages/public/Checkout';
import OrderConfirmation from './pages/public/OrderConfirmation';

// Dashboard Pages por Rol
import AdminDashboard from './pages/admin/AdminDashboard';
import VendedorDashboard from './pages/vendedor/VendedorDashboard';
import BodegaDashboard from './pages/bodega/BodegaDashboard';
import RepartidorDashboard from './pages/repartidor/RepartidorDashboard';
import ClienteDashboard from './pages/cliente/ClienteDashboard';

// PÁGINAS CLIENTE
import ComprasPage from './pages/cliente/ComprasPage';
import MisPedidosPage from './pages/cliente/MisPedidosPage';
import MisRecibosPage from './pages/cliente/MisRecibosPage';
import MiPerfilPage from './pages/cliente/MiPerfilPage';

// PÁGINAS ADMIN
import ProductosPage from './pages/admin/ProductosPage';
import VentasPage from './pages/admin/VentasPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import InventarioPage from './pages/admin/InventarioPage';
import ProveedoresPage from './pages/admin/ProveedoresPage';
import AuditPage from './pages/admin/AuditPage';
import ReportesPage from './pages/admin/ReportesPage';

// PÁGINAS VENDEDOR
import ClientesPage from './pages/vendedor/ClientesPage';
import NuevaVentaPage from './pages/vendedor/NuevaVentaPage';

// PÁGINAS BODEGA
import LotesPage from './pages/bodega/LotesPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Layout
const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

// Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();

  const dashboardByRole = {
    [USER_ROLES.ADMIN]: <AdminDashboard />,
    [USER_ROLES.VENDEDOR]: <VendedorDashboard />,
    [USER_ROLES.BODEGA]: <BodegaDashboard />,
    [USER_ROLES.REPARTIDOR]: <RepartidorDashboard />,
    [USER_ROLES.CLIENTE]: <ClienteDashboard />,
  };

  return dashboardByRole[user?.role] || <Navigate to="/" replace />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* ========== RUTAS PÚBLICAS ========== */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/checkout"
          element={
            <PublicLayout>
              <Checkout />
            </PublicLayout>
          }
        />
        <Route
          path="/pedido-confirmado"
          element={
            <PublicLayout>
              <OrderConfirmation />
            </PublicLayout>
          }
        />

        {/* ========== DASHBOARD PRINCIPAL ========== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRouter />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== RUTAS DE ADMIN ========== */}
        {/* ✅ PRODUCTOS: Ahora accesible por ADMIN, VENDEDOR y BODEGA */}
        <Route
          path="/dashboard/productos"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.VENDEDOR, USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <ProductosPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/ventas"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.VENDEDOR]}>
              <DashboardLayout>
                <VentasPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/usuarios"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <UsuariosPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/inventario"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <InventarioPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/proveedores"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <ProveedoresPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/auditoria"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <AuditPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/reportes"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <ReportesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/configuracion"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Configuración</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== RUTAS DE VENDEDOR ========== */}
        <Route
          path="/dashboard/nueva-venta"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.VENDEDOR]}>
              <DashboardLayout>
                <NuevaVentaPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/mis-ventas"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.VENDEDOR]}>
              <DashboardLayout>
                <VentasPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/clientes"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.VENDEDOR]}>
              <DashboardLayout>
                <ClientesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== RUTAS DE BODEGA ========== */}
        {/* ✅ LOTES: Accesible por ADMIN y BODEGA */}
        <Route
          path="/dashboard/lotes"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <LotesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/entradas"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Entradas de Inventario</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/alertas"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.BODEGA]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Alertas de Stock</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== RUTAS DE REPARTIDOR ========== */}
        <Route
          path="/dashboard/entregas"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.REPARTIDOR]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Mis Entregas</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/ruta"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.REPARTIDOR]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Ruta del Día</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/historial"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.REPARTIDOR]}>
              <DashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Historial de Entregas</h1>
                  <p className="text-neutral-600 mt-2">Módulo en desarrollo...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== RUTAS DE CLIENTE ========== */}
        <Route
          path="/dashboard/compras"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENTE]}>
              <DashboardLayout>
                <ComprasPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/pedidos"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENTE]}>
              <DashboardLayout>
                <MisPedidosPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/recibos"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENTE]}>
              <DashboardLayout>
                <MisRecibosPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/perfil"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENTE]}>
              <DashboardLayout>
                <MiPerfilPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== 404 ========== */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
                <p className="text-neutral-600 mb-8">
                  La página que buscas no existe.
                </p>
                <a href="/" className="btn-primary">
                  Volver al inicio
                </a>
              </div>
            </PublicLayout>
          }
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
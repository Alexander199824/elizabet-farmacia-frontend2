/**
 * @author Alexander Echeverria
 * @file TrackOrder.jsx
 * @description Página de seguimiento de pedidos para invitados (sin login)
 * @location /src/pages/public/TrackOrder.jsx
 */

import { useState } from 'react';
import { FiSearch, FiPackage, FiAlertCircle } from 'react-icons/fi';
import orderService from '../../services/orderService';
import OrderTracking from '../../components/orders/OrderTracking';
import toast from 'react-hot-toast';

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const result = await orderService.trackGuestOrder(orderNumber, email);
      setOrder(result.order);
      toast.success('Pedido encontrado');
    } catch (err) {
      console.error('Error tracking order:', err);
      setError(err.message || 'Pedido no encontrado. Verifica el número de pedido y el email.');
      toast.error('Pedido no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setOrderNumber('');
    setEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <FiPackage className="text-3xl text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Rastrear Mi Pedido
            </h1>
            <p className="text-neutral-600">
              Ingresa tu número de pedido y email para ver el estado de tu orden
            </p>
          </div>

          {/* Formulario de búsqueda */}
          {!order && (
            <div className="bg-white rounded-xl shadow-card p-8 mb-6">
              <form onSubmit={handleTrack} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Número de Pedido <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ORD-202501-000001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    className="input-primary"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Este número te fue enviado por email o SMS al realizar tu pedido
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-primary"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    El email que usaste al hacer el pedido
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3">
                    <FiAlertCircle className="text-danger-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-danger-900">Error</p>
                      <p className="text-sm text-danger-700">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <FiSearch />
                      Rastrear Pedido
                    </>
                  )}
                </button>
              </form>

              {/* Ayuda */}
              <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h3 className="font-semibold text-primary-900 mb-2 text-sm">
                  ¿No encuentras tu número de pedido?
                </h3>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>• Revisa tu email (también la carpeta de spam)</li>
                  <li>• Revisa tus mensajes SMS</li>
                  <li>• El número tiene el formato: ORD-AAAAMM-NNNNNN</li>
                  <li>• Si aún tienes problemas, contáctanos</li>
                </ul>
              </div>
            </div>
          )}

          {/* Resultados del seguimiento */}
          {order && (
            <div className="bg-white rounded-xl shadow-card">
              <OrderTracking
                orderId={order.id}
                orderData={order}
                isGuest={true}
                onClose={handleReset}
              />
            </div>
          )}

          {/* Información de contacto */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              ¿Necesitas ayuda? Contáctanos al{' '}
              <a href="tel:+50212345678" className="text-primary-600 font-medium hover:underline">
                +502 1234-5678
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;

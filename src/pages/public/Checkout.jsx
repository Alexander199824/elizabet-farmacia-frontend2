/**
 * @author Alexander Echeverria
 * @file Checkout.jsx
 * @description Página de checkout para clientes (con o sin autenticación)
 * @location /src/pages/public/Checkout.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiUser, FiMapPin, FiCreditCard, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { DELIVERY_ZONES, PAYMENT_METHODS } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Datos del cliente
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: user?.phone || '',

    // Dirección de entrega
    deliveryZone: '',
    address: user?.address || '',
    reference: '',

    // Pago
    paymentMethod: 'efectivo',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  // Calcular totales
  const subtotal = getCartTotal();
  const selectedZone = DELIVERY_ZONES.find(z => z.value === formData.deliveryZone);
  const deliveryCost = selectedZone?.cost || 0;
  const total = subtotal + deliveryCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.fullName || !formData.phone || !formData.deliveryZone) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.deliveryZone !== 'pickup' && !formData.address) {
      toast.error('Por favor ingresa la dirección de entrega');
      return;
    }

    if (cart.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setLoading(true);

    try {
      // Preparar productos del pedido
      const products = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      // Determinar tipo de entrega
      const deliveryType = formData.deliveryZone === 'pickup' ? 'pickup' : 'delivery';

      // Dirección de envío (solo si es delivery)
      const shippingAddress = deliveryType === 'delivery'
        ? `${formData.address}${formData.reference ? `\nReferencias: ${formData.reference}` : ''}`
        : null;

      // Notas adicionales
      const notes = formData.notes || '';

      let response;

      if (user) {
        // ========== CLIENTE LOGUEADO ==========
        console.log('🔐 Creando pedido como cliente logueado');

        const orderData = {
          products,
          deliveryType,
          shippingAddress,
          paymentMethod: formData.paymentMethod,
          notes
        };

        response = await orderService.createOrder(orderData);
      } else {
        // ========== CLIENTE INVITADO (SIN LOGIN) ==========
        console.log('👤 Creando pedido como invitado');

        // Extraer nombre y apellido
        const nameParts = formData.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const orderData = {
          guestInfo: {
            firstName,
            lastName,
            email: formData.email || '',
            phone: formData.phone,
            address: formData.address || 'N/A'
          },
          products,
          deliveryType,
          shippingAddress,
          paymentMethod: formData.paymentMethod,
          notes
        };

        console.log('📦 Datos del pedido invitado a enviar:', JSON.stringify(orderData, null, 2));
        response = await orderService.createGuestOrder(orderData);
      }

      console.log('✅ Pedido creado exitosamente:', response);

      // Guardar datos del pedido para tracking (invitados)
      if (!user) {
        localStorage.setItem('lastOrderNumber', response.order.orderNumber);
        localStorage.setItem('lastOrderEmail', formData.email);
      }

      toast.success('¡Pedido realizado con éxito! Te contactaremos pronto.');
      clearCart();

      // Redirigir a la página de confirmación
      navigate('/pedido-confirmado', {
        state: {
          orderData: {
            orderNumber: response.order.orderNumber,
            orderDate: new Date().toLocaleString('es-GT', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }),
            customerInfo: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            },
            deliveryInfo: {
              zone: formData.deliveryZone,
              zoneName: selectedZone?.label || '',
              address: formData.address,
              reference: formData.reference,
            },
            paymentMethod: formData.paymentMethod,
            notes: formData.notes,
            items: cart.map(item => ({
              productName: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity
            })),
            subtotal: subtotal,
            deliveryCost: deliveryCost,
            total: total,
          }
        }
      });

    } catch (error) {
      console.error('❌ Error al procesar el pedido:', error);
      toast.error(error.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
              <FiShoppingBag className="text-5xl text-neutral-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
            <p className="text-neutral-600 mb-8">
              Agrega productos para realizar tu pedido
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Ir a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Finalizar Pedido</h1>
            <p className="text-neutral-600">Completa la información para procesar tu pedido</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información del cliente */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold">Información Personal</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre completo <span className="text-danger-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="input-primary"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono <span className="text-danger-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="input-primary"
                        placeholder="+502 1234-5678"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Email (opcional)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-primary"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de entrega */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                      <FiMapPin className="text-success-600" />
                    </div>
                    <h2 className="text-xl font-bold">Información de Entrega</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Zona de entrega <span className="text-danger-500">*</span>
                      </label>
                      <select
                        name="deliveryZone"
                        value={formData.deliveryZone}
                        onChange={handleChange}
                        required
                        className="input-primary"
                      >
                        <option value="">Selecciona una zona</option>
                        {DELIVERY_ZONES.map(zone => (
                          <option key={zone.value} value={zone.value}>
                            {zone.label} {zone.cost > 0 && `- ${formatCurrency(zone.cost)}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.deliveryZone && formData.deliveryZone !== 'pickup' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Dirección completa <span className="text-danger-500">*</span>
                          </label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required={formData.deliveryZone !== 'pickup'}
                            rows="3"
                            className="input-primary"
                            placeholder="Calle, avenida, número de casa..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Referencias (opcional)
                          </label>
                          <input
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleChange}
                            className="input-primary"
                            placeholder="Casa de color azul, portón negro..."
                          />
                        </div>
                      </>
                    )}

                    {formData.deliveryZone === 'pickup' && (
                      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <p className="text-sm text-primary-900 font-medium mb-2">
                          📍 Dirección de la farmacia:
                        </p>
                        <p className="text-sm text-primary-700">
                          Rabinal, Baja Verapaz<br />
                          Horario: Lunes a Domingo, 8:00 AM - 8:00 PM
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de pago */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                      <FiCreditCard className="text-warning-600" />
                    </div>
                    <h2 className="text-xl font-bold">Método de Pago</h2>
                  </div>

                  <div className="space-y-4">
                    {PAYMENT_METHODS.map(method => (
                      <label
                        key={method.value}
                        className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={formData.paymentMethod === method.value}
                          onChange={handleChange}
                          className="w-5 h-5"
                        />
                        <span className="font-medium">{method.label}</span>
                      </label>
                    ))}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="input-primary"
                        placeholder="Instrucciones especiales para tu pedido..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen del pedido */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>

                  {/* Items */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/60'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          <p className="text-sm text-neutral-600">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envío:</span>
                      <span className="font-medium">
                        {deliveryCost === 0 ? 'Gratis' : formatCurrency(deliveryCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        Confirmar Pedido
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-neutral-500 mt-4">
                    Al confirmar, aceptas nuestros términos y condiciones
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

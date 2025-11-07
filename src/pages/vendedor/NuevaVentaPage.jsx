/**
 * @author Alexander Echeverria
 * @file NuevaVentaPage.jsx
 * @description Sistema POS completo para crear ventas
 * @location /src/pages/vendedor/NuevaVentaPage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiUser, FiShoppingCart,
  FiCreditCard, FiCheckCircle, FiX, FiPrinter
} from 'react-icons/fi';
import QuetzalIcon from '../../components/common/QuetzalIcon';
import productService from '../../services/productService';
import clientService from '../../services/clientService';
import invoiceService from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import { PAYMENT_METHODS } from '../../utils/constants';
import toast from 'react-hot-toast';

const NuevaVentaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados principales
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado del carrito de venta
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientType, setClientType] = useState('cf'); // 'cf' o 'registered'

  // Estado de pago
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Modal de búsqueda de productos
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    if (showProductSearch && searchProduct) {
      searchProducts();
    }
  }, [searchProduct]);

  useEffect(() => {
    if (showClientSearch && searchClient) {
      searchClients();
    }
  }, [searchClient]);

  const searchProducts = async () => {
    if (searchProduct.length < 2) {
      setProducts([]);
      return;
    }

    try {
      const response = await productService.searchProducts(searchProduct);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const searchClients = async () => {
    if (searchClient.length < 2) {
      setClients([]);
      return;
    }

    try {
      const response = await clientService.searchClients(searchClient);
      setClients(response.users || []);
    } catch (error) {
      console.error('Error searching clients:', error);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay más stock disponible');
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        unitPrice: product.price
      }]);
      toast.success('Producto agregado');
    }

    setShowProductSearch(false);
    setSearchProduct('');
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = cart.find(item => item.id === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      toast.error('Cantidad excede el stock disponible');
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Producto eliminado');
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setClientType('registered');
    setShowClientSearch(false);
    setSearchClient('');
    toast.success(`Cliente: ${client.firstName} ${client.lastName}`);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientType('cf');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleProcessSale = async () => {
    // Validaciones
    if (cart.length === 0) {
      toast.error('Agrega productos a la venta');
      return;
    }

    if (calculateTotal() <= 0) {
      toast.error('El total debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        sellerId: user.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0
        })),
        paymentMethod,
        discount,
        notes
      };

      // Agregar información del cliente
      if (clientType === 'registered' && selectedClient) {
        saleData.clientId = selectedClient.id;
      } else {
        saleData.clientName = 'Consumidor Final';
        saleData.clientNit = 'CF';
      }

      const response = await invoiceService.createInvoice(saleData);
      
      setCompletedSale(response.invoice);
      setShowConfirmModal(true);
      toast.success('¡Venta procesada exitosamente!');

      // Limpiar formulario
      setCart([]);
      setSelectedClient(null);
      setClientType('cf');
      setDiscount(0);
      setNotes('');
      setPaymentMethod('efectivo');

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error(error.message || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    // Implementar impresión del recibo
    window.print();
  };

  const handleNewSale = () => {
    setShowConfirmModal(false);
    setCompletedSale(null);
  };

  const handleViewSale = () => {
    if (completedSale) {
      navigate(`/dashboard/ventas/${completedSale.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Nueva Venta
          </h1>
          <p className="text-neutral-600 mt-1">
            Sistema de punto de venta
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Productos y Carrito */}
        <div className="lg:col-span-2 space-y-6">
          {/* Búsqueda de Productos */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiSearch className="mr-2 text-primary-500" />
              Buscar Productos
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-xl" />

              {/* Dropdown de productos */}
              {showProductSearch && products.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full p-4 hover:bg-primary-50 transition-colors text-left flex items-center justify-between border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{product.name}</p>
                        <p className="text-sm text-neutral-500">
                          {product.presentation} - Stock: {product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">
                          {formatCurrency(product.price)}
                        </p>
                        {product.stock <= product.minStock && (
                          <span className="text-xs text-warning-600">Stock bajo</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carrito de Venta */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <FiShoppingCart className="mr-2 text-primary-500" />
                Productos en Venta
              </span>
              {cart.length > 0 && (
                <span className="badge-primary">{cart.length}</span>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                  <FiShoppingCart className="text-4xl text-neutral-400" />
                </div>
                <p className="text-neutral-500">
                  No hay productos en la venta
                </p>
                <p className="text-sm text-neutral-400 mt-2">
                  Usa el buscador para agregar productos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-500">{item.presentation}</p>
                      <p className="text-sm text-primary-600 font-medium">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 bg-white hover:bg-neutral-200 rounded-lg transition-colors"
                      >
                        <FiMinus />
                      </button>
                      <span className="w-12 text-center font-bold text-lg">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-2 bg-white hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-lg text-success-600">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="text-xl" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Cliente y Pago */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiUser className="mr-2 text-primary-500" />
              Cliente
            </h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setClientType('cf');
                    clearClient();
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    clientType === 'cf'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Consumidor Final
                </button>
                <button
                  onClick={() => {
                    setClientType('registered');
                    setShowClientSearch(true);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    clientType === 'registered'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Cliente Registrado
                </button>
              </div>

              {selectedClient ? (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                      <p className="text-sm text-neutral-600">{selectedClient.email}</p>
                      {selectedClient.nit && (
                        <p className="text-sm text-neutral-600">NIT: {selectedClient.nit}</p>
                      )}
                    </div>
                    <button
                      onClick={clearClient}
                      className="text-danger-500 hover:text-danger-600"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              ) : clientType === 'registered' ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    onFocus={() => setShowClientSearch(true)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />

                  {showClientSearch && clients.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border max-h-64 overflow-y-auto">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => selectClient(client)}
                          className="w-full p-3 hover:bg-primary-50 transition-colors text-left border-b last:border-b-0"
                        >
                          <p className="font-semibold text-neutral-900">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-neutral-500">{client.email}</p>
                          {client.nit && (
                            <p className="text-xs text-neutral-400">NIT: {client.nit}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 rounded-lg text-center">
                  <p className="text-neutral-600">Consumidor Final</p>
                  <p className="text-sm text-neutral-500">NIT: CF</p>
                </div>
              )}
            </div>
          </div>

          {/* Método de Pago */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiCreditCard className="mr-2 text-primary-500" />
              Método de Pago
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    paymentMethod === method.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descuento */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4">Descuento</h3>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={calculateSubtotal()}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              <QuetzalIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold mb-4">Notas</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows="3"
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          {/* Resumen */}
          <div className="bg-gradient-to-br from-primary-500 to-success-500 rounded-xl shadow-card p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-yellow-200">
                  <span>Descuento:</span>
                  <span className="font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-white/30 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProcessSale}
              disabled={cart.length === 0 || loading}
              className="w-full mt-6 py-4 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  <span>Procesar Venta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && completedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-success-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-4xl text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              ¡Venta Exitosa!
            </h2>
            <p className="text-neutral-600 mb-6">
              Recibo: <span className="font-semibold">{completedSale.invoiceNumber}</span>
            </p>

            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Total:</span>
                <span className="font-bold text-success-600 text-xl">
                  {formatCurrency(completedSale.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Método:</span>
                <span className="capitalize">{completedSale.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full btn-outline flex items-center justify-center space-x-2"
              >
                <FiPrinter />
                <span>Imprimir Recibo</span>
              </button>
              <button
                onClick={handleNewSale}
                className="w-full btn-primary"
              >
                Nueva Venta
              </button>
              <button
                onClick={handleViewSale}
                className="w-full btn-outline"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaVentaPage;
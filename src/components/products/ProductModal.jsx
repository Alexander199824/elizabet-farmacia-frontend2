/**
 * @author Alexander Echeverria
 * @file ProductModal.jsx
 * @description Modal para mostrar detalles completos del producto
 * @location /src/components/products/ProductModal.jsx
 */

import { FiX, FiShoppingCart, FiPackage, FiTruck, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProductModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error('Producto agotado');
      return;
    }
    addToCart(product);
  };

  const getStockInfo = () => {
    if (product.stock <= 0) {
      return {
        icon: <FiAlertCircle className="text-danger-500" />,
        text: 'Agotado',
        color: 'text-danger-600',
        bg: 'bg-danger-50',
      };
    }
    if (product.stock <= product.minStock) {
      return {
        icon: <FiAlertCircle className="text-warning-500" />,
        text: `Pocas unidades (${product.stock} disponibles)`,
        color: 'text-warning-600',
        bg: 'bg-warning-50',
      };
    }
    return {
      icon: <FiCheckCircle className="text-success-500" />,
      text: `Disponible (${product.stock} unidades)`,
      color: 'text-success-600',
      bg: 'bg-success-50',
    };
  };

  const stockInfo = getStockInfo();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-neutral-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <FiX className="text-2xl text-neutral-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Imagen */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl bg-neutral-100 aspect-square">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/500x500?text=Sin+Imagen'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <FiPackage className="text-2xl text-primary-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-600 mb-1">SKU</p>
                  <p className="font-semibold text-neutral-900">{product.sku}</p>
                </div>
                <div className="p-4 bg-success-50 rounded-lg text-center">
                  <FiTruck className="text-2xl text-success-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-600 mb-1">Entrega</p>
                  <p className="font-semibold text-neutral-900">1-3 horas</p>
                </div>
              </div>
            </div>

            {/* Información */}
            <div className="space-y-6">
              {/* Categoría */}
              {product.category && (
                <span className="inline-block px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-full">
                  {product.category}
                </span>
              )}

              {/* Nombre */}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {product.name}
                </h1>
                {product.presentation && (
                  <p className="text-lg text-neutral-600">{product.presentation}</p>
                )}
              </div>

              {/* Stock */}
              <div className={`flex items-center gap-3 p-4 rounded-lg ${stockInfo.bg}`}>
                {stockInfo.icon}
                <span className={`font-medium ${stockInfo.color}`}>
                  {stockInfo.text}
                </span>
              </div>

              {/* Descripción */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Descripción
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Detalles adicionales */}
              <div className="space-y-3 border-t pt-4">
                {product.laboratory && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Laboratorio:</span>
                    <span className="font-medium text-neutral-900">{product.laboratory}</span>
                  </div>
                )}
                {product.activeIngredient && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Principio activo:</span>
                    <span className="font-medium text-neutral-900">{product.activeIngredient}</span>
                  </div>
                )}
                {product.concentration && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Concentración:</span>
                    <span className="font-medium text-neutral-900">{product.concentration}</span>
                  </div>
                )}
              </div>

              {/* Receta médica */}
              {product.requiresPrescription && (
                <div className="p-4 bg-danger-50 border-2 border-danger-200 rounded-lg">
                  <p className="text-danger-600 font-medium text-center flex items-center justify-center gap-2">
                    <span className="text-2xl">⚕️</span>
                    Este producto requiere receta médica
                  </p>
                </div>
              )}

              {/* Precio y botón */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Precio</p>
                    <p className="text-4xl font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`
                    w-full py-4 px-6 rounded-xl font-semibold text-lg
                    flex items-center justify-center gap-3
                    transition-all duration-200
                    ${product.stock > 0
                      ? 'bg-success-500 text-white hover:bg-success-600 hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    }
                  `}
                >
                  <FiShoppingCart className="text-2xl" />
                  {product.stock > 0 ? 'Agregar al carrito' : 'Producto agotado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

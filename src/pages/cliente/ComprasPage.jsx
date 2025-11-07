/**
 * @author Alexander Echeverria
 * @file ComprasPage.jsx
 * @description Página de compras del cliente con catálogo y carrito lateral
 * @location /src/pages/cliente/ComprasPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiShoppingCart, FiFilter, FiX } from 'react-icons/fi';
import ProductGrid from '../../components/products/ProductGrid';
import ProductFilters from '../../components/products/ProductFilters';
import CartDrawer from '../../components/cart/CartDrawer';
import productService from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ComprasPage = () => {
  const { cart, getCartItemsCount, toggleCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        isActive: true,
        ...filters,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await productService.getAllProducts(params);

      setProducts(response.products || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, 500);

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => {
      const cleaned = { ...prev, ...newFilters };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined || cleaned[key] === '') {
          delete cleaned[key];
        }
      });
      return cleaned;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">Hacer Compras</h1>
          <p className="text-neutral-600 mt-2">
            Explora nuestro catálogo y agrega productos a tu carrito
          </p>
        </div>
        <button
          onClick={toggleCart}
          className="btn-primary flex items-center space-x-2 relative"
        >
          <FiShoppingCart className="text-xl" />
          <span>Ver Carrito</span>
          {getCartItemsCount() > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {getCartItemsCount()}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 text-xl" />
            <input
              type="text"
              placeholder="Buscar productos..."
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center space-x-2 justify-center"
          >
            <FiFilter />
            <span>Filtros</span>
          </button>
          {(Object.keys(filters).length > 0 || searchTerm) && (
            <button
              onClick={clearFilters}
              className="btn-outline flex items-center space-x-2 justify-center text-danger-600 border-danger-600 hover:bg-danger-50"
            >
              <FiX />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <ProductFilters onFilterChange={handleFilterChange} activeFilters={filters} />
          </div>
        )}
      </div>

      {/* Products Count */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-neutral-600">
            Mostrando <span className="font-semibold">{products.length}</span> de{' '}
            <span className="font-semibold">{pagination.total}</span> productos
          </p>
          {Object.keys(filters).length > 0 && (
            <span className="text-sm text-primary-600 font-medium">
              {Object.keys(filters).length} filtro(s) activo(s)
            </span>
          )}
        </div>
      )}

      {/* Products Grid */}
      <ProductGrid products={products} loading={loading} />

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          <div className="flex items-center space-x-2">
            {[...Array(pagination.totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              // Show first page, last page, current page, and pages around current
              const showPage =
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1);

              if (!showPage) {
                // Show ellipsis
                if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiShoppingCart className="text-6xl text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-neutral-500 mb-4">
            Intenta ajustar tus filtros o búsqueda
          </p>
          {(Object.keys(filters).length > 0 || searchTerm) && (
            <button onClick={clearFilters} className="btn-primary">
              Limpiar Filtros
            </button>
          )}
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {getCartItemsCount() > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center lg:hidden z-40 hover:bg-primary-700 transition-colors"
        >
          <FiShoppingCart className="text-2xl" />
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-danger-500 rounded-full flex items-center justify-center text-sm font-bold">
            {getCartItemsCount()}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
};

export default ComprasPage;

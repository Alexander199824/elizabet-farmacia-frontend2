/**
 * @author Alexander Echeverria
 * @file Home.jsx
 * @description Página principal - Tienda pública (SIN datos hardcodeados)
 * @location /src/pages/public/Home.jsx
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiTruck, FiPackage, FiHeart } from 'react-icons/fi';
import ProductGrid from '../../components/products/ProductGrid';
import ProductFilters from '../../components/products/ProductFilters';
import productService from '../../services/productService';
import { debounce } from '../../utils/helpers';
import { FARMACIA_INFO } from '../../utils/constants';
import toast from 'react-hot-toast';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-success-500 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {FARMACIA_INFO.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90">
              Tu salud es nuestra prioridad
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Buscar medicamentos..."
                onChange={handleSearch}
                className="w-full px-6 py-4 pl-14 text-neutral-900 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-400 text-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <FiTruck className="text-3xl text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Envio Rapido</h3>
              <p className="text-sm text-neutral-600">Entrega de 1 a 3 horas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-success-100 rounded-full flex items-center justify-center">
                <FiHeart className="text-3xl text-success-600" />
              </div>
              <h3 className="font-semibold mb-2">Atención Médica</h3>
              <p className="text-sm text-neutral-600">Consultas en clínica</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <FiPackage className="text-3xl text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Recoge en Tienda</h3>
              <p className="text-sm text-neutral-600">Pasa a recoger tu pedido</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-1/4">
              <ProductFilters onFilterChange={handleFilterChange} activeFilters={filters} />
            </aside>
            <main className="lg:w-3/4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">Nuestros Productos</h2>
                {!loading && <span className="text-neutral-600">{pagination.total} productos</span>}
              </div>
              <ProductGrid products={products} loading={loading} />
            </main>
          </div>
        </div>
      </section>

      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Contactanos</h2>
          <p className="text-lg mb-8">Estamos aqui para ayudarte</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold">
              {FARMACIA_INFO.phone}
            </div>
            <div className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold">
              {FARMACIA_INFO.email}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
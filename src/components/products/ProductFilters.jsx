/**
 * @author Alexander Echeverria
 * @file ProductFilters.jsx
 * @description Filtros de productos
 * @location /src/components/products/ProductFilters.jsx
 */

import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import { PRODUCT_CATEGORIES } from '../../utils/constants';

const ProductFilters = ({ onFilterChange, activeFilters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryChange = (category) => {
    onFilterChange({ category });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="mb-6">
      {/* Mobile filter button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full btn-outline flex items-center justify-center space-x-2 mb-4"
      >
        <FiFilter />
        <span>Filtros</span>
        {hasActiveFilters && (
          <span className="badge-primary ml-2">{Object.keys(activeFilters).length}</span>
        )}
      </button>

      {/* Filters panel */}
      <div
        className={`
        bg-white rounded-xl shadow-card p-6
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <FiFilter className="text-primary-500" />
            <span>Filtros</span>
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-danger-500 hover:text-danger-600 flex items-center space-x-1"
            >
              <FiX />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Categorías */}
        <div className="mb-6">
          <h4 className="font-semibold text-neutral-700 mb-3">Categoría</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="category"
                checked={!activeFilters.category}
                onChange={() => handleCategoryChange('')}
                className="text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm">Todas las categorías</span>
            </label>
            {PRODUCT_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={activeFilters.category === cat.value}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Receta médica */}
        <div>
          <h4 className="font-semibold text-neutral-700 mb-3">Otros</h4>
          <label className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={activeFilters.requiresPrescription || false}
              onChange={(e) => onFilterChange({ requiresPrescription: e.target.checked || undefined })}
              className="text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm">Solo productos con receta</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
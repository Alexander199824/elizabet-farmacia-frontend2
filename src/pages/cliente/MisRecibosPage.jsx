/**
 * @author Alexander Echeverria
 * @file MisRecibosPage.jsx
 * @description Página de recibos del cliente (antes facturas)
 * @location /src/pages/cliente/MisRecibosPage.jsx
 */

import { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiEye, FiCalendar, FiDollarSign, FiPackage } from 'react-icons/fi';
import invoiceService from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MisRecibosPage = () => {
  const { user } = useAuth();
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecibo, setSelectedRecibo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecibos();
    }
  }, [user]);

  const fetchRecibos = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getAllInvoices({
        clientId: user.id,
        page: 1,
        limit: 100,
        sortBy: 'invoiceDate',
        sortOrder: 'desc'
      });
      setRecibos(response.invoices || []);
    } catch (error) {
      console.error('Error fetching recibos:', error);
      toast.error('Error al cargar los recibos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', color: 'warning' },
      en_proceso: { label: 'En Proceso', color: 'primary' },
      completada: { label: 'Completada', color: 'success' },
      cancelada: { label: 'Cancelada', color: 'danger' },
      anulada: { label: 'Anulada', color: 'danger' },
    };
    const config = statusConfig[status] || statusConfig.pendiente;
    return <span className={`badge badge-${config.color}`}>{config.label}</span>;
  };

  const handleViewDetails = async (recibo) => {
    try {
      const details = await invoiceService.getInvoiceById(recibo.id);
      setSelectedRecibo(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching recibo details:', error);
      toast.error('Error al cargar los detalles del recibo');
    }
  };

  const handleDownloadRecibo = (recibo) => {
    toast.success(`Descargando recibo ${recibo.invoiceNumber}...`);
    // Aquí implementarías la descarga del PDF
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">Mis Recibos</h1>
          <p className="text-neutral-600 mt-2">
            Historial completo de tus compras y recibos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FiFileText className="text-2xl text-primary-600" />
          <span className="text-lg font-semibold">{recibos.length} recibos</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-2xl text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Recibos</p>
              <p className="text-2xl font-bold">{recibos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-2xl text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Gastado</p>
              <p className="text-2xl font-bold">
                {formatCurrency(recibos.reduce((sum, r) => sum + r.total, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-2xl text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Completados</p>
              <p className="text-2xl font-bold">
                {recibos.filter(r => r.status === 'completada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recibos List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {recibos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Número de Recibo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Productos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recibos.map((recibo) => (
                  <tr key={recibo.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-primary-600">
                        {recibo.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-neutral-400" />
                        <span>{formatDate(recibo.invoiceDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {recibo.items?.length || 0} productos
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-success-600">
                        {formatCurrency(recibo.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(recibo.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(recibo)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <FiEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDownloadRecibo(recibo)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <FiDownload className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FiFileText className="text-6xl text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
              No tienes recibos aún
            </h3>
            <p className="text-neutral-500">
              Tus compras aparecerán aquí una vez que realices tu primera compra
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedRecibo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Recibo {selectedRecibo.invoiceNumber}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Fecha:</span>
                <span className="font-semibold">{formatDate(selectedRecibo.invoiceDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Estado:</span>
                {getStatusBadge(selectedRecibo.status)}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Productos:</h3>
                <div className="space-y-2">
                  {selectedRecibo.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-neutral-600">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-success-600">{formatCurrency(selectedRecibo.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisRecibosPage;

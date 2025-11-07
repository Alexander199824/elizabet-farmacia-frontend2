/**
 * @author Alexander Echeverria
 * @file exportUtils.js
 * @description Utilidades para exportar datos a Excel y PDF
 * @location /src/utils/exportUtils.js
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './helpers';

/**
 * Exporta datos a Excel
 */
export const exportToExcel = (data, fileName = 'reporte') => {
  try {
    const wb = XLSX.utils.book_new();

    // Si data es un objeto con múltiples hojas
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(data).forEach((sheetName) => {
        const ws = XLSX.utils.json_to_sheet(data[sheetName]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    } else {
      // Si es un array simple
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};

/**
 * Exporta datos a PDF
 */
export const exportToPDF = (title, sections, fileName = 'reporte') => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Título principal
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, yPosition);
    yPosition += 10;

    // Fecha
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha: ${formatDate(new Date())}`, 14, yPosition);
    yPosition += 15;

    // Procesar cada sección
    sections.forEach((section) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Título de sección
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(section.title, 14, yPosition);
      yPosition += 8;

      // Contenido de la sección
      if (section.type === 'table' && section.data && section.data.length > 0) {
        // Tabla
        doc.autoTable({
          startY: yPosition,
          head: [section.columns],
          body: section.data,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      } else if (section.type === 'stats' && section.stats) {
        // Estadísticas en formato clave-valor
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        section.stats.forEach((stat) => {
          doc.text(`${stat.label}: ${stat.value}`, 14, yPosition);
          yPosition += 7;
        });
        yPosition += 5;
      } else if (section.type === 'text') {
        // Texto simple
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(section.content, 180);
        doc.text(lines, 14, yPosition);
        yPosition += lines.length * 7 + 5;
      }
    });

    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    return false;
  }
};

/**
 * Prepara datos de ventas para exportación
 */
export const prepareSalesDataForExport = (salesData, topProducts, categoryData, hourlyData) => {
  const sheets = {};

  // Hoja 1: Ventas diarias
  if (salesData?.daily) {
    sheets['Ventas Diarias'] = salesData.daily.map((item) => ({
      Fecha: formatDate(item.date),
      'Total Ventas': formatCurrency(item.total),
      'Cantidad Transacciones': item.count,
      'Promedio': formatCurrency(item.total / (item.count || 1)),
    }));
  }

  // Hoja 2: Top productos
  if (topProducts && topProducts.length > 0) {
    sheets['Top Productos'] = topProducts.map((product, index) => ({
      Posición: index + 1,
      Producto: product.name,
      'Cantidad Vendida': product.quantitySold,
      'Ingreso Total': formatCurrency(product.totalRevenue || 0),
    }));
  }

  // Hoja 3: Ventas por categoría
  if (categoryData && categoryData.length > 0) {
    sheets['Por Categoría'] = categoryData.map((cat) => ({
      Categoría: cat.category,
      'Total Ventas': formatCurrency(cat.total),
      'Cantidad': cat.count,
    }));
  }

  // Hoja 4: Ventas por hora
  if (hourlyData && hourlyData.length > 0) {
    sheets['Por Hora'] = hourlyData.map((item) => ({
      Hora: `${item.hour}:00`,
      'Total Ventas': formatCurrency(item.total),
      'Transacciones': item.count || 0,
    }));
  }

  return sheets;
};

/**
 * Prepara datos de inventario para exportación
 */
export const prepareInventoryDataForExport = (inventoryData, lowStockProducts, expiringProducts) => {
  const sheets = {};

  // Hoja 1: Resumen de inventario
  if (inventoryData) {
    sheets['Resumen'] = [
      { Métrica: 'Valor Total', Valor: formatCurrency(inventoryData.totalValue || 0) },
      { Métrica: 'Productos con Stock Bajo', Valor: inventoryData.lowStock || 0 },
      { Métrica: 'Productos Agotados', Valor: inventoryData.outOfStock || 0 },
      { Métrica: 'Productos con Stock OK', Valor: inventoryData.okStock || 0 },
    ];

    // Hoja 2: Por categoría
    if (inventoryData.byCategory) {
      sheets['Por Categoría'] = inventoryData.byCategory.map((cat) => ({
        Categoría: cat.category,
        Cantidad: cat.quantity,
        'Valor Total': formatCurrency(cat.value || 0),
      }));
    }
  }

  // Hoja 3: Stock bajo
  if (lowStockProducts && lowStockProducts.length > 0) {
    sheets['Stock Bajo'] = lowStockProducts.map((product) => ({
      Producto: product.name,
      'Stock Actual': product.stock,
      'Stock Mínimo': product.minStock,
      'Stock Máximo': product.maxStock || product.minStock * 2,
      'Requerido': Math.max(0, (product.maxStock || product.minStock * 2) - product.stock),
      Estado: product.stock === 0 ? 'Agotado' : 'Bajo',
    }));
  }

  // Hoja 4: Próximos a vencer
  if (expiringProducts && expiringProducts.length > 0) {
    sheets['Próximos a Vencer'] = expiringProducts.map((batch) => ({
      Producto: batch.product?.name || 'N/A',
      'Número de Lote': batch.batchNumber,
      Cantidad: batch.currentQuantity,
      'Fecha Vencimiento': formatDate(batch.expirationDate),
      'Días Restantes': Math.ceil((new Date(batch.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)),
    }));
  }

  return sheets;
};

/**
 * Prepara datos de movimientos para exportación
 */
export const prepareMovementsDataForExport = (movementsData) => {
  const sheets = {};

  if (movementsData) {
    // Hoja 1: Resumen
    sheets['Resumen'] = [
      { Métrica: 'Total Entradas', Valor: movementsData.totalEntries || 0 },
      { Métrica: 'Total Salidas', Valor: movementsData.totalExits || 0 },
      { Métrica: 'Balance', Valor: (movementsData.totalEntries || 0) - (movementsData.totalExits || 0) },
    ];

    // Hoja 2: Movimientos diarios
    if (movementsData.daily) {
      sheets['Por Día'] = movementsData.daily.map((item) => ({
        Fecha: formatDate(item.date),
        Entradas: item.entries || 0,
        Salidas: item.exits || 0,
        Balance: (item.entries || 0) - (item.exits || 0),
      }));
    }
  }

  return sheets;
};

/**
 * Prepara datos generales del dashboard para exportación
 */
export const prepareDashboardDataForExport = (dashboardData) => {
  if (!dashboardData) return [];

  return [
    { Métrica: 'Ventas Totales', Valor: formatCurrency(dashboardData.sales?.total || 0) },
    { Métrica: 'Cantidad de Transacciones', Valor: dashboardData.sales?.count || 0 },
    { Métrica: 'Ticket Promedio', Valor: formatCurrency(dashboardData.sales?.average || 0) },
    { Métrica: 'Productos con Stock Bajo', Valor: dashboardData.inventory?.lowStock || 0 },
    { Métrica: 'Total de Productos', Valor: dashboardData.inventory?.totalProducts || 0 },
    { Métrica: 'Productos por Vencer (30 días)', Valor: dashboardData.inventory?.expiring || 0 },
  ];
};

/**
 * Genera PDF de resumen general
 */
export const generateOverviewPDF = (dashboardData, salesData, topProducts, lowStockProducts, expiringProducts, dateRange) => {
  const sections = [];

  // Sección 1: Estadísticas principales
  sections.push({
    title: 'Resumen Ejecutivo',
    type: 'stats',
    stats: [
      { label: 'Período', value: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` },
      { label: 'Ventas Totales', value: formatCurrency(dashboardData?.sales?.total || 0) },
      { label: 'Transacciones', value: dashboardData?.sales?.count || 0 },
      { label: 'Ticket Promedio', value: formatCurrency(dashboardData?.sales?.average || 0) },
      { label: 'Productos con Stock Bajo', value: dashboardData?.inventory?.lowStock || 0 },
      { label: 'Productos por Vencer', value: dashboardData?.inventory?.expiring || 0 },
    ],
  });

  // Sección 2: Top 5 productos
  if (topProducts && topProducts.length > 0) {
    sections.push({
      title: 'Top 5 Productos Más Vendidos',
      type: 'table',
      columns: ['#', 'Producto', 'Unidades', 'Ingresos'],
      data: topProducts.slice(0, 5).map((product, index) => [
        index + 1,
        product.name,
        product.quantitySold,
        formatCurrency(product.totalRevenue || 0),
      ]),
    });
  }

  // Sección 3: Alertas de stock bajo
  if (lowStockProducts && lowStockProducts.length > 0) {
    sections.push({
      title: 'Productos con Stock Bajo',
      type: 'table',
      columns: ['Producto', 'Stock', 'Mínimo', 'Estado'],
      data: lowStockProducts.slice(0, 10).map((product) => [
        product.name,
        product.stock,
        product.minStock,
        product.stock === 0 ? 'Agotado' : 'Bajo',
      ]),
    });
  }

  // Sección 4: Productos por vencer
  if (expiringProducts && expiringProducts.length > 0) {
    sections.push({
      title: 'Productos Próximos a Vencer (30 días)',
      type: 'table',
      columns: ['Producto', 'Lote', 'Cantidad', 'Vencimiento', 'Días'],
      data: expiringProducts.slice(0, 10).map((batch) => [
        batch.product?.name || 'N/A',
        batch.batchNumber,
        batch.currentQuantity,
        formatDate(batch.expirationDate),
        Math.ceil((new Date(batch.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)),
      ]),
    });
  }

  return exportToPDF('Reporte General - Farmacia Elizabeth', sections, `reporte-general-${formatDate(new Date())}`);
};

/**
 * Genera PDF de ventas
 */
export const generateSalesPDF = (salesData, topProducts, categoryData, dateRange) => {
  const sections = [];

  // Resumen de ventas
  if (salesData) {
    const totalVentas = salesData.daily?.reduce((sum, day) => sum + day.total, 0) || 0;
    const totalTransacciones = salesData.daily?.reduce((sum, day) => sum + day.count, 0) || 0;

    sections.push({
      title: 'Resumen de Ventas',
      type: 'stats',
      stats: [
        { label: 'Período', value: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` },
        { label: 'Ventas Totales', value: formatCurrency(totalVentas) },
        { label: 'Transacciones', value: totalTransacciones },
        { label: 'Promedio por Día', value: formatCurrency(totalVentas / (salesData.daily?.length || 1)) },
      ],
    });
  }

  // Top productos
  if (topProducts && topProducts.length > 0) {
    sections.push({
      title: 'Top 10 Productos Más Vendidos',
      type: 'table',
      columns: ['#', 'Producto', 'Unidades', 'Ingresos'],
      data: topProducts.map((product, index) => [
        index + 1,
        product.name,
        product.quantitySold,
        formatCurrency(product.totalRevenue || 0),
      ]),
    });
  }

  // Ventas por categoría
  if (categoryData && categoryData.length > 0) {
    sections.push({
      title: 'Ventas por Categoría',
      type: 'table',
      columns: ['Categoría', 'Ventas', 'Transacciones'],
      data: categoryData.map((cat) => [cat.category, formatCurrency(cat.total), cat.count]),
    });
  }

  return exportToPDF('Reporte de Ventas - Farmacia Elizabeth', sections, `reporte-ventas-${formatDate(new Date())}`);
};

/**
 * Genera PDF de inventario
 */
export const generateInventoryPDF = (inventoryData, lowStockProducts, expiringProducts) => {
  const sections = [];

  // Resumen de inventario
  if (inventoryData) {
    sections.push({
      title: 'Resumen de Inventario',
      type: 'stats',
      stats: [
        { label: 'Valor Total', value: formatCurrency(inventoryData.totalValue || 0) },
        { label: 'Productos con Stock Bajo', value: inventoryData.lowStock || 0 },
        { label: 'Productos Agotados', value: inventoryData.outOfStock || 0 },
        { label: 'Productos con Stock OK', value: inventoryData.okStock || 0 },
      ],
    });
  }

  // Stock bajo
  if (lowStockProducts && lowStockProducts.length > 0) {
    sections.push({
      title: 'Productos con Stock Bajo',
      type: 'table',
      columns: ['Producto', 'Stock', 'Mínimo', 'Requerido'],
      data: lowStockProducts.map((product) => [
        product.name,
        product.stock,
        product.minStock,
        Math.max(0, (product.maxStock || product.minStock * 2) - product.stock),
      ]),
    });
  }

  // Próximos a vencer
  if (expiringProducts && expiringProducts.length > 0) {
    sections.push({
      title: 'Productos Próximos a Vencer',
      type: 'table',
      columns: ['Producto', 'Lote', 'Cantidad', 'Vencimiento', 'Días'],
      data: expiringProducts.map((batch) => [
        batch.product?.name || 'N/A',
        batch.batchNumber,
        batch.currentQuantity,
        formatDate(batch.expirationDate),
        Math.ceil((new Date(batch.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)),
      ]),
    });
  }

  return exportToPDF('Reporte de Inventario - Farmacia Elizabeth', sections, `reporte-inventario-${formatDate(new Date())}`);
};

/**
 * Genera PDF de movimientos
 */
export const generateMovementsPDF = (movementsData, dateRange) => {
  const sections = [];

  if (movementsData) {
    sections.push({
      title: 'Resumen de Movimientos',
      type: 'stats',
      stats: [
        { label: 'Período', value: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` },
        { label: 'Total Entradas', value: movementsData.totalEntries || 0 },
        { label: 'Total Salidas', value: movementsData.totalExits || 0 },
        { label: 'Balance', value: (movementsData.totalEntries || 0) - (movementsData.totalExits || 0) },
      ],
    });

    if (movementsData.daily && movementsData.daily.length > 0) {
      sections.push({
        title: 'Movimientos Diarios',
        type: 'table',
        columns: ['Fecha', 'Entradas', 'Salidas', 'Balance'],
        data: movementsData.daily.map((item) => [
          formatDate(item.date),
          item.entries || 0,
          item.exits || 0,
          (item.entries || 0) - (item.exits || 0),
        ]),
      });
    }
  }

  return exportToPDF('Reporte de Movimientos - Farmacia Elizabeth', sections, `reporte-movimientos-${formatDate(new Date())}`);
};

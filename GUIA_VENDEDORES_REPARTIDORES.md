# 📋 Guía Completa - Frontend para Vendedores y Repartidores

## 📌 Introducción

Este documento describe cómo funcionan actualmente las interfaces de **Vendedores** y **Repartidores** en el sistema de gestión de pedidos en línea de la Farmacia Elizabet.

**Autor:** Alexander Echeverria
**Fecha:** 2025-11-06
**Sistema:** Farmacia Elizabet - Frontend React

---

## 🎯 Resumen del Sistema Actual

### ✅ Funcionalidades Implementadas

El sistema ya cuenta con:

1. **Panel de Pedidos Online (Vendedores)** - [PedidosOnlinePage.jsx](src/pages/vendedor/PedidosOnlinePage.jsx)
   - ✅ Visualización de pedidos pendientes de preparación
   - ✅ Filtrado por tipo de entrega (pickup/delivery)
   - ✅ Estadísticas en tiempo real
   - ✅ Flujo completo de preparación de pedidos
   - ✅ Actualización automática cada 30 segundos

2. **Panel de Entregas (Repartidores)** - [PedidosEntregaPage.jsx](src/pages/repartidor/PedidosEntregaPage.jsx)
   - ✅ Vista de pedidos disponibles para entregar
   - ✅ Vista de "Mis Pedidos" asignados
   - ✅ Integración con mapas para direcciones
   - ✅ Llamadas directas a clientes
   - ✅ Confirmación de entregas con generación automática de recibos

---

## 🔄 Ciclo de Vida de Pedidos

### Estados del Sistema

| Estado | Descripción | Quién lo actualiza |
|--------|-------------|-------------------|
| `pendiente` | Pedido recién creado | Sistema (automático al crear) |
| `confirmado` | Pedido aceptado por farmacia | Vendedor |
| `en_preparacion` | Pedido siendo preparado | Vendedor |
| `listo_para_recoger` | Listo para que cliente recoja | Vendedor (solo pickup) |
| `en_camino` | Repartidor salió con el pedido | Repartidor (solo delivery) |
| `entregado` | Pedido entregado al cliente | Vendedor/Repartidor |
| `completado` | Sinónimo de entregado | Sistema |

### Flujos Visuales

#### 📦 Recoger en Tienda (Pickup)
```
Cliente crea pedido → pendiente
                         ↓
Vendedor confirma    → confirmado
                         ↓
Vendedor prepara     → en_preparacion
                         ↓
Vendedor marca listo → listo_para_recoger
                         ↓
Cliente recoge       → entregado
                         ↓
                    🧾 RECIBO GENERADO AUTOMÁTICAMENTE
```

#### 🚚 Envío a Domicilio (Delivery)
```
Cliente crea pedido → pendiente
                         ↓
Vendedor confirma    → confirmado
                         ↓
Vendedor prepara     → en_preparacion
                         ↓
Vendedor marca listo → listo (esperando repartidor)
                         ↓
Repartidor toma      → en_camino
                         ↓
Repartidor entrega   → entregado
                         ↓
                    🧾 RECIBO GENERADO AUTOMÁTICAMENTE
```

---

## 💻 Panel de Vendedor - PedidosOnlinePage

### 🎨 Interfaz Actual

La página muestra:
- **Header con estadísticas**: Total, Pendientes, En Preparación
- **Filtros por tipo**: Todos, Recoger en Tienda, Delivery
- **Tarjetas de pedidos** con toda la información relevante
- **Botones de acción** según el estado del pedido

### 📡 Endpoints Utilizados

#### 1. Obtener Pedidos Pendientes de Preparación
```javascript
// Archivo: src/services/invoiceService.js:80-97
getPendingPreparation: async (deliveryType = null, limit = 50) => {
  try {
    let url = '/invoices/pending-preparation';
    const params = {};

    if (deliveryType) {
      params.deliveryType = deliveryType;
    }
    if (limit) {
      params.limit = limit;
    }

    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Uso en el componente:**
```javascript
const cargarPedidos = async () => {
  const deliveryType = filtro === 'todos' ? null : filtro;
  const response = await invoiceService.getPendingPreparation(deliveryType);
  setPedidos(response.orders || []);
};
```

#### 2. Comenzar Preparación
```javascript
// Archivo: src/services/invoiceService.js:105-112
startPreparation: async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/start-preparation`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Cambio de estado:** `pendiente` → `en_preparacion`

#### 3. Marcar Como Listo
```javascript
// Archivo: src/services/invoiceService.js:120-127
markAsReady: async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/mark-ready`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Cambio de estado:**
- Para pickup: `en_preparacion` → `listo_para_recoger`
- Para delivery: `en_preparacion` → `listo` (esperando repartidor)

#### 4. Marcar Como Entregado (Solo Pickup)
```javascript
// Archivo: src/services/invoiceService.js:135-142
markAsDeliveredPickup: async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/mark-delivered`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Cambio de estado:** `listo_para_recoger` → `entregado`
**⚠️ IMPORTANTE:** Genera recibo automáticamente

### 🎯 Funciones de la Página

#### 1. Cargar Pedidos
```javascript
const cargarPedidos = async () => {
  setLoading(true);
  try {
    const deliveryType = filtro === 'todos' ? null : filtro;
    const response = await invoiceService.getPendingPreparation(deliveryType);

    setPedidos(response.orders || []);
    setStats({
      total: response.total || 0,
      pending: response.pending || 0,
      inProgress: response.inProgress || 0
    });
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    toast.error('Error al cargar pedidos');
  } finally {
    setLoading(false);
  }
};
```

**Se ejecuta:**
- Al cargar la página
- Cada 30 segundos (actualización automática)
- Al cambiar filtro
- Después de cada acción (comenzar, listo, entregar)

#### 2. Comenzar Preparación
```javascript
const comenzarPreparacion = async (invoiceId) => {
  try {
    await invoiceService.startPreparation(invoiceId);
    toast.success('Pedido tomado para preparar');
    cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.message || 'Error al tomar pedido');
  }
};
```

**Cuándo se muestra:** Cuando `status === 'pendiente'`

#### 3. Marcar Como Listo
```javascript
const marcarListo = async (invoiceId) => {
  try {
    await invoiceService.markAsReady(invoiceId);
    toast.success('Pedido marcado como listo');
    cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.message || 'Error al marcar como listo');
  }
};
```

**Cuándo se muestra:** Cuando `status === 'en_preparacion'`

#### 4. Marcar Como Entregado
```javascript
const marcarEntregado = async (invoiceId) => {
  if (!confirm('¿Confirmar que el cliente recogió el pedido?')) return;

  try {
    await invoiceService.markAsDeliveredPickup(invoiceId);
    toast.success('Pedido marcado como entregado');
    cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.message || 'Error al marcar como entregado');
  }
};
```

**Cuándo se muestra:**
- Cuando `status === 'listo_para_recoger'`
- Y `deliveryType === 'pickup'`

### 🎨 Componentes Visuales

#### Tarjeta de Pedido
```jsx
<div className="bg-white rounded-lg shadow-card">
  {/* Header con número y badges */}
  <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100">
    <h3>{pedido.invoiceNumber}</h3>
    <span>Badge de tipo de entrega</span>
    <span>Badge de estado</span>

    {/* Mensaje si está entregado */}
    {(pedido.status === 'entregado' || pedido.status === 'completado') && (
      <div className="bg-green-50 border border-green-200">
        ✓ Recibo generado automáticamente para el cliente
      </div>
    )}
  </div>

  {/* Información del cliente */}
  <div className="p-4 bg-neutral-50">
    <p>Cliente: {pedido.client.firstName} {pedido.client.lastName}</p>
    <p>Email: {pedido.client.email}</p>

    {/* Si es delivery, mostrar dirección */}
    {pedido.deliveryType === 'delivery' && (
      <>
        <p>📍 {pedido.deliveryAddress}</p>
        <p>📱 {pedido.deliveryPhone}</p>
        {pedido.deliveryNotes && (
          <div className="bg-blue-50">
            📝 {pedido.deliveryNotes}
          </div>
        )}
      </>
    )}
  </div>

  {/* Lista de productos */}
  <div className="p-4">
    {pedido.items.map(item => (
      <div>
        <p>{item.product.name}</p>
        <p>x{item.quantity}</p>
        <p>{formatCurrency(item.unitPrice)}</p>
      </div>
    ))}
  </div>

  {/* Total y botones de acción */}
  <div className="p-4 bg-neutral-50">
    <p>Total: {formatCurrency(pedido.total)}</p>

    {/* Botones según estado */}
    {pedido.status === 'pendiente' && (
      <button onClick={() => comenzarPreparacion(pedido.id)}>
        Comenzar a Preparar
      </button>
    )}

    {pedido.status === 'en_preparacion' && (
      <button onClick={() => marcarListo(pedido.id)}>
        Marcar como Listo
      </button>
    )}

    {pedido.status === 'listo_para_recoger' && pedido.deliveryType === 'pickup' && (
      <button onClick={() => marcarEntregado(pedido.id)}>
        Entregar al Cliente
      </button>
    )}

    {pedido.preparationStatus === 'listo' && pedido.deliveryType === 'delivery' && (
      <div className="bg-yellow-50">
        ⏳ Esperando repartidor
        <p>El recibo se generará automáticamente cuando el repartidor confirme la entrega</p>
      </div>
    )}

    {(pedido.status === 'entregado' || pedido.status === 'completado') && (
      <div className="bg-green-50">
        ✅ Pedido Completado
        <p>Recibo generado automáticamente</p>
      </div>
    )}
  </div>
</div>
```

---

## 🚚 Panel de Repartidor - PedidosEntregaPage

### 🎨 Interfaz Actual

La página tiene dos pestañas:
1. **"Disponibles"**: Pedidos listos para ser tomados
2. **"Mis Pedidos"**: Pedidos que el repartidor ya tomó

### 📡 Endpoints Utilizados

#### 1. Obtener Pedidos Listos para Delivery
```javascript
// Archivo: src/services/invoiceService.js:151-158
getReadyForDelivery: async () => {
  try {
    const response = await api.get('/invoices/ready-for-delivery');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Devuelve:** Pedidos con `deliveryType === 'delivery'` y `status === 'listo'`

#### 2. Obtener Mis Pedidos (Repartidor)
```javascript
// Archivo: src/services/invoiceService.js:164-171
getMyDeliveries: async () => {
  try {
    const response = await api.get('/invoices/my-deliveries');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Devuelve:** Pedidos asignados al repartidor autenticado

#### 3. Tomar Pedido para Entregar
```javascript
// Archivo: src/services/invoiceService.js:179-186
takeForDelivery: async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/take-for-delivery`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Cambio de estado:** `listo` → `en_camino`
**Asigna:** El pedido al repartidor autenticado

#### 4. Marcar Como Entregado (Delivery)
```javascript
// Archivo: src/services/invoiceService.js:194-201
markAsDeliveredDelivery: async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/mark-delivered`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
```

**Cambio de estado:** `en_camino` → `entregado`
**⚠️ IMPORTANTE:** Genera recibo automáticamente

### 🎯 Funciones de la Página

#### 1. Cargar Pedidos
```javascript
const cargarPedidos = async () => {
  setLoading(true);
  try {
    if (vistaActiva === 'disponibles') {
      const response = await invoiceService.getReadyForDelivery();
      setPedidosDisponibles(response.orders || []);
      setStats({
        ready: response.ready || 0,
        inRoute: response.inRoute || 0
      });
    } else {
      const response = await invoiceService.getMyDeliveries();
      setMisPedidos(response.orders || []);
    }
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    toast.error('Error al cargar pedidos');
  } finally {
    setLoading(false);
  }
};
```

**Se ejecuta:**
- Al cargar la página
- Cada 30 segundos
- Al cambiar de pestaña
- Después de cada acción

#### 2. Tomar Pedido
```javascript
const tomarPedido = async (invoiceId) => {
  try {
    await invoiceService.takeForDelivery(invoiceId);
    toast.success('Pedido asignado. Ve a "Mis Pedidos" para verlo');
    cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.message || 'Error al tomar pedido');
  }
};
```

**Cuándo se muestra:** En pestaña "Disponibles" para pedidos con `status === 'listo'`

#### 3. Marcar Como Entregado
```javascript
const marcarEntregado = async (invoiceId) => {
  if (!confirm('¿Confirmar que el pedido fue entregado al cliente?\n\nNOTA: Al confirmar la entrega, se generará automáticamente el recibo para el cliente.')) return;

  try {
    await invoiceService.markAsDeliveredDelivery(invoiceId);
    toast.success('✓ Pedido entregado. Recibo generado automáticamente para el cliente.');
    cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.message || 'Error al marcar como entregado');
  }
};
```

**Cuándo se muestra:** En pestaña "Mis Pedidos" para pedidos con `status === 'en_camino'`

#### 4. Funciones Auxiliares

##### Abrir Mapa
```javascript
const abrirMapa = (address) => {
  if (!address) {
    toast.error('No hay dirección disponible');
    return;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank');
};
```

##### Llamar Cliente
```javascript
const llamarCliente = (phone) => {
  if (!phone) {
    toast.error('No hay número de teléfono disponible');
    return;
  }
  window.location.href = `tel:${phone}`;
};
```

### 🎨 Componentes Visuales

#### Tarjeta de Pedido (Vista Disponibles)
```jsx
<div className="bg-white rounded-lg shadow-card">
  {/* Header */}
  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
    <h3>{pedido.invoiceNumber}</h3>
    <p>{formatDate(pedido.invoiceDate)}</p>
    {pedido.estimatedDeliveryTime && (
      <p>⏰ Estimado: {hora}</p>
    )}
    <span>Badge de estado</span>
  </div>

  {/* Información de entrega */}
  <div className="p-4 bg-blue-50">
    <p>📦 {pedido.client.firstName} {pedido.client.lastName}</p>

    {/* Teléfono con botón llamar */}
    <div>
      <p>📱 {pedido.deliveryPhone}</p>
      <button onClick={() => llamarCliente(pedido.deliveryPhone)}>
        Llamar
      </button>
    </div>

    {/* Dirección con botón ver mapa */}
    <div>
      <p>📍 {pedido.deliveryAddress}</p>
      <button onClick={() => abrirMapa(pedido.deliveryAddress)}>
        Ver Mapa
      </button>
    </div>

    {/* Instrucciones especiales */}
    {pedido.deliveryNotes && (
      <div className="bg-white border-l-4 border-blue-500">
        <p>📝 Instrucciones Especiales:</p>
        <p>{pedido.deliveryNotes}</p>
      </div>
    )}
  </div>

  {/* Productos */}
  <div className="p-4">
    <p>Productos a Entregar:</p>
    {pedido.items.map(item => (
      <div>
        <p>{item.product.name}</p>
        <p>x{item.quantity}</p>
        <p>{formatCurrency(item.total)}</p>
      </div>
    ))}
  </div>

  {/* Total y botón */}
  <div className="p-4 bg-neutral-50">
    <p>Total a Cobrar: {formatCurrency(pedido.total)}</p>
    <p>Método: {pedido.paymentMethod}</p>

    <button onClick={() => tomarPedido(pedido.id)}>
      🚚 Tomar para Entregar
    </button>
    <p className="text-xs">El recibo se generará automáticamente al confirmar la entrega</p>
  </div>
</div>
```

#### Tarjeta de Pedido (Mis Pedidos)
```jsx
<div className="bg-white rounded-lg shadow-card">
  {/* Similar al anterior pero con botón diferente */}

  <div className="p-4 bg-neutral-50">
    <p>Total a Cobrar: {formatCurrency(pedido.total)}</p>
    <p>Método: {pedido.paymentMethod}</p>

    {pedido.status === 'en_camino' && (
      <>
        <button onClick={() => marcarEntregado(pedido.id)}>
          ✅ Marcar como Entregado
        </button>
        <div className="bg-blue-50">
          <p>📄 Al confirmar entrega, se genera automáticamente el recibo para el cliente</p>
        </div>
      </>
    )}

    {(pedido.status === 'entregado' || pedido.status === 'completado') && (
      <div className="bg-green-50">
        <p>✅ Entregado</p>
        <p>Recibo generado automáticamente</p>
      </div>
    )}
  </div>
</div>
```

---

## 📊 Estadísticas y Dashboard

### Panel de Vendedor - Stats Cards

```jsx
<div className="grid grid-cols-3 gap-4">
  {/* Pendientes */}
  <div className="bg-warning-50 border border-warning-200">
    <p>Pendientes</p>
    <p className="text-2xl">{stats.pending}</p>
  </div>

  {/* En Preparación */}
  <div className="bg-primary-50 border border-primary-200">
    <p>En Preparación</p>
    <p className="text-2xl">{stats.inProgress}</p>
  </div>

  {/* Total */}
  <div className="bg-success-50 border border-success-200">
    <p>Total</p>
    <p className="text-2xl">{stats.total}</p>
  </div>
</div>
```

### Panel de Repartidor - Stats Cards

```jsx
<div className="grid grid-cols-3 gap-4">
  {/* En Camino */}
  <div className="bg-primary-50 border border-primary-200">
    <p>En Camino</p>
    <p className="text-2xl">
      {misPedidos.filter(p => p.preparationStatus === 'en_camino').length}
    </p>
  </div>

  {/* Completadas Hoy */}
  <div className="bg-success-50 border border-success-200">
    <p>Completadas Hoy</p>
    <p className="text-2xl">
      {misPedidos.filter(p => p.preparationStatus === 'entregado').length}
    </p>
  </div>

  {/* Total Mis Pedidos */}
  <div className="bg-warning-50 border border-warning-200">
    <p>Total Mis Pedidos</p>
    <p className="text-2xl">{misPedidos.length}</p>
  </div>
</div>
```

---

## ⚠️ Reglas Importantes

### 🔐 Seguridad y Permisos

1. **Vendedores:**
   - ✅ Pueden ver todos los pedidos pendientes de preparación
   - ✅ Pueden cambiar estados hasta `listo_para_recoger`
   - ✅ Solo pueden entregar pedidos tipo `pickup`
   - ❌ NO pueden marcar como entregados los pedidos `delivery`

2. **Repartidores:**
   - ✅ Solo ven pedidos tipo `delivery`
   - ✅ Solo pueden tomar pedidos en estado `listo`
   - ✅ Solo pueden actualizar sus propios pedidos asignados
   - ❌ NO pueden modificar pedidos de otros repartidores

### 🧾 Generación de Recibos

**⚠️ CRÍTICO - Los recibos se generan AUTOMÁTICAMENTE en el backend cuando:**

1. Vendedor marca un pedido pickup como `entregado`
2. Repartidor marca un pedido delivery como `entregado`

**El frontend NO debe:**
- ❌ Intentar crear recibos manualmente
- ❌ Mostrar recibos antes de que el pedido sea entregado
- ✅ Confiar en que el backend los genera automáticamente
- ✅ Informar al usuario que el recibo se generó

### 🔄 Actualización Automática

Ambas páginas se actualizan automáticamente cada 30 segundos:

```javascript
useEffect(() => {
  cargarPedidos();
  const interval = setInterval(cargarPedidos, 30000);
  return () => clearInterval(interval);
}, [filtro]);
```

Esto garantiza que:
- Los vendedores ven nuevos pedidos inmediatamente
- Los repartidores ven pedidos disponibles en tiempo real
- Los cambios de estado se reflejan automáticamente

---

## 🎯 Flujo Completo - Ejemplo Práctico

### Escenario 1: Pedido Pickup (Recoger en Tienda)

1. **Cliente crea pedido** → Estado: `pendiente`
2. **Vendedor ve el pedido en su panel**
   - Aparece en tarjeta con badge amarillo "Pendiente"
   - Muestra botón "Comenzar a Preparar"
3. **Vendedor hace clic en "Comenzar a Preparar"**
   - Llamada a `startPreparation(invoiceId)`
   - Estado cambia a `en_preparacion`
   - Badge cambia a púrpura "En Preparación"
   - Botón cambia a "Marcar como Listo"
4. **Vendedor prepara el pedido físicamente**
5. **Vendedor hace clic en "Marcar como Listo"**
   - Llamada a `markAsReady(invoiceId)`
   - Estado cambia a `listo_para_recoger`
   - Badge cambia a verde "Listo para Recoger"
   - Botón cambia a "Entregar al Cliente"
6. **Cliente llega a la tienda**
7. **Vendedor hace clic en "Entregar al Cliente"**
   - Muestra confirmación: "¿Confirmar que el cliente recogió el pedido?"
   - Llamada a `markAsDeliveredPickup(invoiceId)`
   - Estado cambia a `entregado`
   - **🧾 Backend genera recibo automáticamente**
   - Toast: "Pedido marcado como entregado"
   - Pedido desaparece del panel (ya no está pendiente)
   - Cliente puede ver y descargar su recibo

### Escenario 2: Pedido Delivery (Envío a Domicilio)

1. **Cliente crea pedido** → Estado: `pendiente`
2. **Vendedor ve el pedido en su panel**
   - Aparece con badge naranja "Envío a Domicilio"
   - Muestra dirección y teléfono del cliente
   - Botón "Comenzar a Preparar"
3. **Vendedor hace clic en "Comenzar a Preparar"**
   - Estado cambia a `en_preparacion`
4. **Vendedor prepara el pedido**
5. **Vendedor hace clic en "Marcar como Listo"**
   - Estado cambia a `listo`
   - Muestra mensaje: "⏳ Esperando repartidor"
   - Pedido aparece en panel de repartidores
6. **Repartidor ve el pedido en "Disponibles"**
   - Ve dirección, teléfono, productos
   - Puede llamar al cliente con un clic
   - Puede ver mapa con un clic
   - Botón "Tomar para Entregar"
7. **Repartidor hace clic en "Tomar para Entregar"**
   - Llamada a `takeForDelivery(invoiceId)`
   - Estado cambia a `en_camino`
   - Pedido se asigna al repartidor
   - Pedido desaparece de "Disponibles"
   - Pedido aparece en "Mis Pedidos"
   - Toast: "Pedido asignado"
8. **Repartidor va a la dirección**
9. **Repartidor llega y hace clic en "Marcar como Entregado"**
   - Muestra confirmación con nota sobre recibo
   - Llamada a `markAsDeliveredDelivery(invoiceId)`
   - Estado cambia a `entregado`
   - **🧾 Backend genera recibo automáticamente**
   - Toast: "✓ Pedido entregado. Recibo generado automáticamente"
   - Cliente puede ver y descargar su recibo

---

## 🔧 Funciones Auxiliares Útiles

### Formatear Moneda
```javascript
import { formatCurrency } from '../../utils/helpers';

formatCurrency(123.45) // "Q123.45"
```

### Formatear Fecha
```javascript
import { formatDate } from '../../utils/helpers';

formatDate("2025-01-15T10:30:00Z") // "15 ene 2025 10:30"
```

### Toast Notifications
```javascript
import toast from 'react-hot-toast';

toast.success('Operación exitosa');
toast.error('Error al procesar');
toast.loading('Procesando...', { id: 'unique-id' });
toast.success('Completado', { id: 'unique-id' }); // Actualiza el toast anterior
```

---

## 🐛 Troubleshooting

### Problema: Los pedidos no se cargan

**Solución:**
1. Verificar que el token esté en localStorage: `localStorage.getItem('authToken')`
2. Verificar que el usuario tenga el rol correcto (`vendedor` o `repartidor`)
3. Ver la consola del navegador para errores de API
4. Verificar que el backend esté corriendo

### Problema: El botón no hace nada

**Solución:**
1. Abrir la consola del navegador
2. Ver si hay errores en rojo
3. Verificar que la función esté correctamente conectada al `onClick`
4. Verificar que el endpoint exista en el backend

### Problema: El estado no se actualiza visualmente

**Solución:**
1. La función `cargarPedidos()` se llama después de cada acción
2. Si el pedido sigue apareciendo, puede ser que el backend no haya actualizado
3. Esperar a la actualización automática (30 segundos)
4. O recargar manualmente con el botón "Actualizar"

### Problema: No se genera el recibo

**Solución:**
1. **El frontend NO genera recibos** - el backend lo hace automáticamente
2. Verificar que el estado del pedido sea `entregado` o `completado`
3. El cliente debe esperar unos segundos para que el backend procese
4. Si después de 1 minuto no aparece, verificar logs del backend

---

## 📚 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| [src/services/invoiceService.js](src/services/invoiceService.js) | Todos los endpoints de pedidos |
| [src/pages/vendedor/PedidosOnlinePage.jsx](src/pages/vendedor/PedidosOnlinePage.jsx) | Panel de vendedor |
| [src/pages/repartidor/PedidosEntregaPage.jsx](src/pages/repartidor/PedidosEntregaPage.jsx) | Panel de repartidor |
| [src/components/orders/OrderTracking.jsx](src/components/orders/OrderTracking.jsx) | Componente de seguimiento |

---

## ✅ Checklist de Funcionalidades

### Panel de Vendedor
- [x] Ver pedidos pendientes de preparación
- [x] Filtrar por tipo de entrega (pickup/delivery)
- [x] Ver estadísticas en tiempo real
- [x] Comenzar preparación de pedido
- [x] Marcar pedido como listo
- [x] Entregar pedido pickup al cliente
- [x] Ver información completa del cliente
- [x] Ver dirección y teléfono para delivery
- [x] Actualización automática cada 30 segundos
- [x] Mensajes informativos sobre recibos
- [x] Confirmación antes de entregar

### Panel de Repartidor
- [x] Ver pedidos listos para entregar
- [x] Ver mis pedidos asignados
- [x] Tomar pedido para entregar
- [x] Ver dirección en Google Maps
- [x] Llamar directamente al cliente
- [x] Ver instrucciones especiales
- [x] Marcar pedido como entregado
- [x] Ver estadísticas de entregas
- [x] Actualización automática
- [x] Confirmación con nota sobre recibo
- [x] Estados visuales claros

---

**Última actualización:** 2025-11-06
**Versión:** 1.0
**Autor:** Alexander Echeverria

---

## 📞 Soporte

Si tienes dudas sobre cómo usar estas funcionalidades:
1. Revisa esta guía completa
2. Verifica la consola del navegador para errores
3. Contacta al desarrollador con información específica del error

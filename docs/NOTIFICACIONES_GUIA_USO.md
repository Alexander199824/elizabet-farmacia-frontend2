# Guía de Uso - Sistema de Notificaciones

Esta guía explica cómo usar y probar el nuevo sistema de notificaciones implementado en la aplicación.

## 📋 Índice

1. [¿Qué se ha implementado?](#qué-se-ha-implementado)
2. [¿Cómo funciona?](#cómo-funciona)
3. [Probar el Sistema](#probar-el-sistema)
4. [Notificaciones por Rol](#notificaciones-por-rol)
5. [Personalización](#personalización)
6. [Próximos Pasos](#próximos-pasos)

---

## ¿Qué se ha implementado?

### ✅ Componentes Creados

1. **NotificationBell** (`src/components/notifications/NotificationBell.jsx`)
   - Campanita interactiva con badge de conteo
   - Animación de pulso para notificaciones nuevas
   - Click para abrir/cerrar dropdown

2. **NotificationDropdown** (`src/components/notifications/NotificationDropdown.jsx`)
   - Lista de notificaciones con scroll
   - Iconos y colores según el tipo de notificación
   - Botones para marcar como leída o eliminar
   - Formato de tiempo relativo ("Hace 5 min", "Hace 2h", etc.)

3. **NotificationService** (`src/services/notificationService.js`)
   - Servicio completo para gestionar notificaciones
   - Soporte para API del backend (cuando esté disponible)
   - Fallback a localStorage para funcionar sin backend

4. **NotificationContext** (`src/context/NotificationContext.jsx`)
   - Contexto global para estado de notificaciones
   - Hooks personalizados para facilitar el uso
   - Actualización automática cada 30 segundos

5. **useOrderNotifications** (`src/hooks/useOrderNotifications.js`)
   - Hook que detecta cambios en pedidos automáticamente
   - Genera notificaciones según el rol del usuario

### ✅ Integración Completa

- La campanita está en el header de todos los paneles (admin, vendedor, bodega, repartidor, cliente)
- Sistema integrado en páginas de pedidos (vendedor, repartidor, cliente)
- Notificaciones automáticas cuando cambia el estado de un pedido

---

## ¿Cómo funciona?

### Sistema de Almacenamiento

**Por ahora (sin backend):**
- Las notificaciones se guardan en `localStorage` del navegador
- Funcionan completamente offline
- Persisten entre sesiones del navegador

**Con backend (futuro):**
- Las notificaciones se guardarán en la base de datos
- Sincronización automática con el servidor
- Accesibles desde cualquier dispositivo

### Flujo Automático

```
1. Usuario realiza una acción (ej: crear pedido)
   ↓
2. Hook detecta el cambio en los datos
   ↓
3. Sistema determina quién debe ser notificado
   ↓
4. Se crea la notificación con el mensaje apropiado
   ↓
5. Badge de la campanita se actualiza
   ↓
6. Usuario ve la notificación en tiempo real
```

---

## Probar el Sistema

### Opción 1: Usar las Notificaciones de Ejemplo (Recomendado)

Hemos creado un componente de prueba para generar notificaciones de ejemplo:

1. Navega a cualquier dashboard
2. Abre la consola del navegador (F12)
3. Ejecuta:
   ```javascript
   // Generar una notificación de prueba
   window.testNotifications?.addTestNotification('nuevo_pedido');
   ```

**Tipos de notificaciones disponibles:**
- `'nuevo_pedido'` - Para vendedores/admin
- `'pedido_confirmado'` - Para clientes
- `'pedido_listo'` - Para clientes/repartidores
- `'pedido_en_camino'` - Para clientes
- `'pedido_entregado'` - Para clientes
- `'stock_bajo'` - Para admin/bodega
- `'lote_vencimiento'` - Para admin/bodega

### Opción 2: Probar con Flujo Real de Pedidos

#### Como Cliente:
1. Inicia sesión como cliente
2. Haz una compra y crea un pedido
3. Espera a que un vendedor actualice el estado del pedido
4. Verás notificaciones automáticamente cuando:
   - El pedido sea confirmado
   - El pedido esté en preparación
   - El pedido esté listo
   - El pedido sea entregado

#### Como Vendedor:
1. Inicia sesión como vendedor
2. Ve a "Pedidos Online"
3. Cuando un cliente cree un pedido nuevo, verás una notificación automáticamente
4. El contador de la campanita se actualizará

#### Como Repartidor:
1. Inicia sesión como repartidor
2. Ve a "Pedidos de Entrega"
3. Cuando te asignen un pedido, recibirás una notificación
4. Cuando un pedido esté listo para envío, recibirás una notificación

### Opción 3: Agregar Notificaciones Manualmente desde el Código

En cualquier componente donde tengas acceso al contexto de notificaciones:

```javascript
import { useNotifications } from '../context/NotificationContext';

function MiComponente() {
  const { addNotification, NOTIFICATION_TYPES } = useNotifications();

  const handleClick = () => {
    addNotification(NOTIFICATION_TYPES.EXITO, {
      message: '¡Operación completada exitosamente!'
    });
  };

  return <button onClick={handleClick}>Probar Notificación</button>;
}
```

---

## Notificaciones por Rol

### 👨‍💼 Admin
Recibe notificaciones sobre:
- ✅ Nuevos pedidos creados
- ✅ Pedidos cancelados por clientes
- ⚠️ Stock bajo
- ⏰ Lotes próximos a vencer

### 👔 Vendedor
Recibe notificaciones sobre:
- ✅ Nuevos pedidos creados
- ✅ Pedidos cancelados por clientes

### 📦 Bodega
Recibe notificaciones sobre:
- ⚠️ Stock bajo
- ⏰ Lotes próximos a vencer

### 🚚 Repartidor
Recibe notificaciones sobre:
- 📍 Pedidos asignados a él
- ✨ Pedidos listos para envío

### 👤 Cliente
Recibe notificaciones sobre:
- ✅ Pedido confirmado
- 📦 Pedido en preparación
- ✨ Pedido listo para recoger/enviar
- 🚚 Pedido en camino
- 🎉 Pedido entregado
- ❌ Pedido cancelado

---

## Personalización

### Cambiar los Mensajes de Notificación

Edita el archivo `src/services/notificationService.js` en la función `getNotificationMessage()`:

```javascript
export const getNotificationMessage = (type, data = {}) => {
  const messages = {
    [NOTIFICATION_TYPES.NUEVO_PEDIDO]: {
      title: '🛒 Nuevo Pedido', // Cambiar aquí
      message: `Pedido #${data.orderId || ''} recibido de ${data.customerName || 'cliente'}`
    },
    // ... más mensajes
  };
  return messages[type];
};
```

### Cambiar el Intervalo de Actualización

Por defecto, las notificaciones se actualizan cada 30 segundos. Para cambiarlo, edita `src/context/NotificationContext.jsx`:

```javascript
// Línea ~78
const interval = setInterval(loadNotifications, 30000); // 30 segundos
// Cambiar a:
const interval = setInterval(loadNotifications, 60000); // 60 segundos (1 minuto)
```

### Cambiar los Colores

Los colores están definidos en `src/components/notifications/NotificationDropdown.jsx` en la función `getNotificationColor()`:

```javascript
const getNotificationColor = (type) => {
  const colorMap = {
    'nuevo_pedido': 'bg-primary-50 border-primary-200', // Cambiar aquí
    // ... más colores
  };
  return colorMap[type];
};
```

---

## Características del Sistema

### ✨ Funcionalidades Implementadas

- ✅ Badge con conteo de notificaciones no leídas
- ✅ Animación de pulso para notificaciones nuevas
- ✅ Dropdown con lista de notificaciones
- ✅ Marcar individual como leída
- ✅ Marcar todas como leídas
- ✅ Eliminar notificaciones
- ✅ Iconos emoji según el tipo
- ✅ Colores según el tipo
- ✅ Tiempo relativo ("Hace 5 min")
- ✅ Scroll en la lista
- ✅ Cierre automático al hacer clic fuera
- ✅ Actualización automática cada 30 segundos
- ✅ Detección automática de cambios en pedidos
- ✅ Notificaciones según el rol del usuario
- ✅ Fallback a localStorage sin backend

### 🚧 Pendiente (Backend)

- ⏳ Almacenamiento en base de datos
- ⏳ Sincronización entre dispositivos
- ⏳ Notificaciones push en navegador
- ⏳ WebSockets para tiempo real
- ⏳ Filtrado avanzado
- ⏳ Búsqueda en notificaciones

---

## Próximos Pasos

### 1. Implementar Backend (Prioridad Alta)

Ver documento: `docs/BACKEND_NOTIFICATIONS_API.md`

Este documento incluye:
- Modelo de datos (tabla SQL)
- Endpoints de la API
- Triggers de base de datos
- Ejemplos de código

### 2. Agregar Notificaciones Push (Opcional)

Para notificaciones del navegador cuando la pestaña está en segundo plano:

```javascript
// Solicitar permiso
if ('Notification' in window) {
  Notification.requestPermission();
}

// Mostrar notificación
new Notification('Nuevo Pedido', {
  body: 'Pedido #123 recibido',
  icon: '/logo.png',
  badge: '/badge.png'
});
```

### 3. Agregar WebSockets (Opcional)

Para notificaciones en tiempo real sin polling:

```javascript
// En el backend
io.to(`user_${userId}`).emit('new_notification', notification);

// En el frontend
socket.on('new_notification', (notification) => {
  addNotification(notification);
});
```

---

## Troubleshooting

### La campanita no aparece
- ✅ Verifica que estás logueado
- ✅ Refresca la página (Ctrl + R)
- ✅ Verifica la consola del navegador (F12) por errores

### Las notificaciones no se guardan
- ✅ Verifica que localStorage esté habilitado en tu navegador
- ✅ Limpia el caché (Ctrl + Shift + Del)
- ✅ Prueba en modo incógnito

### El conteo no se actualiza
- ✅ Espera 30 segundos (actualización automática)
- ✅ Refresca manualmente haciendo clic en la campanita
- ✅ Verifica que el hook `useOrderNotifications` esté incluido en la página

### No recibo notificaciones automáticas
- ✅ Verifica que estás en una página que use `useOrderNotifications`
- ✅ Verifica que el cambio sea relevante para tu rol
- ✅ Prueba con el componente de prueba (ver "Probar el Sistema")

---

## Soporte

Si encuentras algún problema o tienes sugerencias:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que todos los archivos estén creados correctamente
3. Asegúrate de que el backend esté corriendo (si aplica)
4. Consulta la documentación de la API del backend

---

## Ejemplos de Uso en Código

### Ejemplo 1: Agregar notificación manual

```javascript
import { useNotifications } from '../context/NotificationContext';

function MiComponente() {
  const { addNotification, NOTIFICATION_TYPES } = useNotifications();

  const handleAction = async () => {
    try {
      // ... lógica de tu componente

      // Agregar notificación de éxito
      addNotification(NOTIFICATION_TYPES.EXITO, {
        message: 'Acción completada exitosamente'
      });
    } catch (error) {
      // Agregar notificación de error
      addNotification(NOTIFICATION_TYPES.ERROR, {
        message: error.message || 'Ocurrió un error'
      });
    }
  };

  return <button onClick={handleAction}>Ejecutar Acción</button>;
}
```

### Ejemplo 2: Notificar cambio de pedido

```javascript
import { useNotifications } from '../context/NotificationContext';

function ActualizarPedido({ pedido }) {
  const { notifyOrderChange } = useNotifications();

  const handleStatusChange = async (newStatus) => {
    const oldStatus = pedido.estado;

    // Actualizar pedido
    const updatedOrder = await orderService.updateOrderStatus(pedido.id, newStatus);

    // Notificar el cambio
    notifyOrderChange(updatedOrder, oldStatus, newStatus);
  };

  return <button onClick={() => handleStatusChange('confirmado')}>Confirmar Pedido</button>;
}
```

### Ejemplo 3: Monitorear cambios automáticamente

```javascript
import { useOrderNotifications } from '../hooks/useOrderNotifications';

function ListaDePedidos() {
  const [pedidos, setPedidos] = useState([]);

  // Este hook detectará automáticamente cambios en los pedidos
  // y generará notificaciones según corresponda
  useOrderNotifications(pedidos);

  useEffect(() => {
    // Cargar pedidos cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {pedidos.map(pedido => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}
    </div>
  );
}
```

---

## Conclusión

El sistema de notificaciones está completamente funcional en el frontend. Por ahora usa `localStorage` como almacenamiento temporal, pero está preparado para conectarse automáticamente al backend una vez que los endpoints estén implementados.

**¡Disfruta del nuevo sistema de notificaciones! 🎉**

# Flujos de Estado de Pedidos Online

## 📋 Flujo para Pedidos PICKUP (Recoger en tienda)

```
pendiente
    ↓
confirmado (vendedor confirma el pedido)
    ↓
en_preparacion (vendedor prepara el pedido)
    ↓
listo_para_recoger (vendedor marca como listo)
    ↓
entregado (vendedor marca entregado cuando cliente recoge)
    ↓
completado (automático al entregar)
```

## 🚚 Flujo para Pedidos DELIVERY (Envío a domicilio)

```
pendiente
    ↓
confirmado (vendedor confirma el pedido)
    ↓
en_preparacion (vendedor prepara el pedido)
    ↓
listo_para_envio (vendedor marca como listo, esperando repartidor)
    ↓
en_camino (repartidor recoge el pedido y lo marca en camino)
    ↓
entregado (repartidor marca como entregado al entregar al cliente)
    ↓
completado (automático al entregar)
```

## ⚠️ Reglas Importantes

### Transiciones Válidas para PICKUP (Con retroceso permitido):
- `pendiente` → `confirmado`, `cancelado`
- `confirmado` → `pendiente`, `en_preparacion`, `cancelado` ⬅️ **Puede volver atrás**
- `en_preparacion` → `confirmado`, `listo_para_recoger`, `cancelado` ⬅️ **Puede volver atrás**
- `listo_para_recoger` → `en_preparacion`, `entregado`, `cancelado` ⬅️ **Puede volver atrás**
- `entregado` → `completado` ❌ **No puede retroceder**
- `completado` → ❌ **Estado final**
- `cancelado` → ❌ **Estado final**

### Transiciones Válidas para DELIVERY (Con retroceso permitido):
- `pendiente` → `confirmado`, `cancelado`
- `confirmado` → `pendiente`, `en_preparacion`, `cancelado` ⬅️ **Puede volver atrás**
- `en_preparacion` → `confirmado`, `listo_para_envio`, `cancelado` ⬅️ **Puede volver atrás**
- `listo_para_envio` → `en_preparacion`, `en_camino`, `cancelado` ⬅️ **Puede volver atrás** (esperando repartidor)
- `en_camino` → `listo_para_envio`, `entregado`, `cancelado` ⬅️ **Puede volver atrás** (repartidor en ruta)
- `entregado` → `completado` ❌ **No puede retroceder**
- `completado` → ❌ **Estado final**
- `cancelado` → ❌ **Estado final**

### 🔄 Retroceso de Estados

**¿Cuándo se puede retroceder?**
- ✅ Antes de marcar como `entregado`
- ✅ Si se cometió un error al cambiar el estado
- ❌ Una vez entregado o completado (genera factura y descuenta stock)
- ❌ Una vez cancelado

## 🔧 Funciones del Frontend Corregidas

### `comenzarPreparacion()`
Ahora maneja automáticamente el flujo:
1. Si el pedido está en `pendiente`, primero lo confirma
2. Luego lo cambia a `en_preparacion`

### `marcarListo()`
Ahora maneja diferentes tipos de entrega:
- **PICKUP**: Cambia a `listo_para_recoger` (esperando que el cliente venga a recoger)
- **DELIVERY**: Cambia a `listo_para_envio` (esperando que un repartidor lo recoja)

### `marcarEntregado()`
Cambia el estado a `entregado` (funciona igual para ambos tipos)

## 💡 Notas para Desarrollo

- Cada transición de estado dispara acciones en el backend:
  - `confirmado`: Registra timestamp `confirmedAt`
  - `en_preparacion`: Registra timestamp `preparedAt` y asigna lotes FIFO
  - `listo_para_recoger`: Registra timestamp `readyAt` (PICKUP)
  - `listo_para_envio`: Registra timestamp `readyAt` (DELIVERY - esperando repartidor)
  - `en_camino`: Registra timestamp `shippedAt` y asigna repartidor (DELIVERY)
  - `entregado`: Genera factura y recibo automáticamente, descuenta stock, registra `deliveredAt`

## 📱 Visualización en Pedidos Online (Vendedor)

El componente `PedidosOnlinePage.jsx` ahora tiene **2 PESTAÑAS PRINCIPALES**:

### 📂 Pestaña "Pedidos Activos" (por defecto)
Muestra pedidos que requieren acción del vendedor:
- ✅ Pedidos pendientes de confirmar (`pendiente`)
- ✅ Pedidos confirmados (`confirmado`)
- ✅ Pedidos en preparación (`en_preparacion`)
- ✅ **Pedidos listos para recoger** (`listo_para_recoger`) - Se mantienen visibles hasta que el cliente recoja
- ✅ Pedidos listos para envío (`listo_para_envio`) - Esperando repartidor
- ✅ Pedidos en camino (`en_camino`) - Repartidor en ruta
- 🔄 **Auto-actualización**: Se refresca cada 5 minutos automáticamente

### 📚 Pestaña "Historial Completados" ⭐ **NUEVA**
Muestra los últimos 50 pedidos completados:
- ✅ Pedidos entregados (`entregado`)
- ✅ Pedidos completados (`completado`)
- 📊 **Historial estático**: No se actualiza automáticamente
- 🔍 **Filtros disponibles**: Pickup, Delivery o Todos
- 💡 **Útil para**: Revisar entregas del día, buscar información de pedidos pasados

### 🎯 Flujo Completo para PICKUP (Recoger en Tienda):
1. Vendedor ve pedido → Confirma llamando al cliente
2. Vendedor comienza preparación
3. Vendedor marca como "Listo para Recoger"
4. **El pedido SIGUE VISIBLE en la lista** con botón "Cliente Recogió el Pedido"
5. Cuando el cliente llega y recoge → Vendedor marca como entregado
6. Sistema genera recibo automáticamente
7. Pedido desaparece de la lista (pasa a completado)

### 🎯 Flujo Completo para DELIVERY (Envío a Domicilio):
1. Vendedor ve pedido → Confirma llamando al cliente
2. Vendedor comienza preparación
3. Vendedor marca como "Listo para Envío"
4. **El pedido SIGUE VISIBLE** esperando que un repartidor lo tome
5. Repartidor recoge pedido y marca "En Camino"
6. **El pedido SIGUE VISIBLE** hasta que el repartidor entregue
7. Repartidor entrega al cliente → Marca como entregado
8. Sistema genera recibo automáticamente
9. Pedido desaparece de la lista (pasa a completado)

## ⚠️ Errores de Transición

Si intentas hacer una transición inválida, el backend devolverá error 400 con:
  ```json
  {
    "message": "No se puede cambiar de 'pendiente' a 'en_preparacion' para pedidos de tipo delivery",
    "validTransitions": ["confirmado", "cancelado"]
  }
  ```

## 🐛 Debugging

Si tienes problemas con cambios de estado, verifica:
1. El estado actual del pedido
2. El tipo de entrega (pickup/delivery)
3. Los logs en la consola del navegador
4. Los logs del servidor backend

Los logs en el frontend ahora muestran:
```
🎯 Iniciando preparación del pedido: 2
📋 Estado actual del pedido: pendiente
⏩ Pedido pendiente, confirmando primero...
✅ Pedido confirmado
⏩ Cambiando a en_preparacion...
✅ Pedido actualizado exitosamente
```

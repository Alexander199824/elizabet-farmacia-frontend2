# Funcionalidad: Deshacer Estados de Pedidos

**Fecha:** 2025-11-06
**Autor:** Alexander Echeverria

## 🎯 Problema Resuelto

**Escenario:** Un vendedor cambia el estado de un pedido por error (por ejemplo, marca como "En Preparación" un pedido que debía quedarse como "Confirmado").

**Solución Anterior:** ❌ No se podía retroceder - el pedido quedaba bloqueado en el estado incorrecto.

**Solución Nueva:** ✅ Botón de "Deshacer" que permite retroceder al estado anterior.

---

## 🔧 Implementación

### Backend

**Archivo modificado:** `farmacia-backend/app/controllers/order.controller.js`

Se actualizaron las transiciones válidas para permitir retrocesos:

```javascript
// PICKUP - Antes:
'confirmado' → ['en_preparacion', 'cancelado']

// PICKUP - Ahora:
'confirmado' → ['pendiente', 'en_preparacion', 'cancelado'] // ⬅️ Puede volver atrás
```

**Transiciones bidireccionales permitidas:**

#### Para PICKUP:
```
confirmado ⇄ pendiente
en_preparacion ⇄ confirmado
listo_para_recoger ⇄ en_preparacion
```

#### Para DELIVERY:
```
confirmado ⇄ pendiente
en_preparacion ⇄ confirmado
en_camino ⇄ en_preparacion
```

**⚠️ Limitaciones (Estados irreversibles):**
- `entregado` → NO puede volver atrás (ya se generó factura y se descontó stock)
- `completado` → Estado final
- `cancelado` → Estado final

---

### Frontend

**Archivo modificado:** `elizabet-farmacia-frontend/src/pages/vendedor/PedidosOnlinePage.jsx`

**Nueva función:** `retrocederEstado(orderId)`

```javascript
const retrocederEstado = async (orderId) => {
  // Determinar estado anterior automáticamente
  const estadosRetroceso = {
    'confirmado': 'pendiente',
    'en_preparacion': 'confirmado',
    'listo_para_recoger': 'en_preparacion',
    'en_camino': 'en_preparacion'
  };

  // Confirmar acción con el usuario
  // Actualizar estado
  // Mostrar notificación de éxito
};
```

**Nuevos botones en la UI:**

Cada tarjeta de pedido ahora muestra:
1. **Botón principal** (acción para avanzar)
2. **Botón "Deshacer"** (acción para retroceder) ⬅️ NUEVO

Ejemplo visual:

```
┌─────────────────────────────────┐
│  Pedido #PED-202511-000002      │
│  Estado: En Preparación         │
│                                 │
│  [✓ Marcar como Listo]         │  ⬅️ Avanzar
│  [↶ Deshacer (Volver a         │  ⬅️ Retroceder (NUEVO)
│     Confirmado)]                │
└─────────────────────────────────┘
```

---

## 📋 Casos de Uso

### Caso 1: Error al marcar pedido
**Situación:** Vendedor hace clic en "Comenzar a Preparar" por error en el pedido equivocado.

**Solución:**
1. El pedido pasa de `pendiente` → `confirmado` → `en_preparacion`
2. Vendedor hace clic en **"Deshacer (Volver a Confirmado)"**
3. El pedido vuelve a `confirmado`
4. Si necesario, puede hacer clic nuevamente en **"Deshacer (Volver a Pendiente)"**
5. El pedido regresa a su estado inicial

### Caso 2: Cliente cambia de idea
**Situación:** Cliente llama y dice "todavía no estoy listo, espera un momento".

**Solución:**
1. Vendedor hace clic en **"Deshacer"**
2. El pedido retrocede un estado
3. Cuando el cliente esté listo, el vendedor avanza nuevamente

### Caso 3: Delivery marcado en camino por error
**Situación:** Se marcó un pedido como "En Camino" pero el repartidor aún no salió.

**Solución:**
1. Hacer clic en **"Deshacer (Volver a En Preparación)"**
2. El pedido vuelve a `en_preparacion`
3. Se puede reasignar repartidor o esperar

---

## 🚨 Restricciones Importantes

### ❌ NO se puede retroceder desde:

1. **Estado `entregado`**
   - Razón: Ya se generó factura y recibo
   - Razón: Ya se descontó stock del inventario
   - Razón: Ya se registraron movimientos de inventario
   - **Solución alternativa:** Crear una devolución/cancelación manual

2. **Estado `completado`**
   - Razón: Estado final del flujo
   - **Solución alternativa:** Contactar a administrador

3. **Estado `cancelado`**
   - Razón: Estado final del flujo
   - **Solución alternativa:** Crear nuevo pedido si es necesario

### ⚠️ Confirmación requerida

Cada vez que se intenta retroceder un estado, se muestra un diálogo de confirmación:

```
¿Deshacer y volver al estado "confirmado"?
[Cancelar] [Aceptar]
```

Esto previene retrocesos accidentales.

---

## 🎨 Interfaz de Usuario

### Botón "Deshacer"

**Estilo:**
- Botón outline (borde visible, fondo transparente)
- Tamaño de texto: `text-sm` (más pequeño que el botón principal)
- Ícono: `FiCornerUpLeft` (flecha hacia arriba e izquierda)
- Color: Hereda del tema (neutral)

**Texto del botón:**
- "Deshacer (Volver a Pendiente)"
- "Deshacer (Volver a Confirmado)"
- "Deshacer (Volver a En Preparación)"

El texto es **descriptivo** para que el usuario sepa exactamente a qué estado va a retroceder.

---

## 🔍 Logs y Debugging

Cuando se retrocede un estado, se generan logs detallados:

```javascript
🔄 Retrocediendo estado del pedido: 2
⬅️ Retrocediendo de "en_preparacion" a "confirmado"

// En el backend:
📝 [UPDATE STATUS] Request recibido: { orderId: 2, newStatus: 'confirmado', ... }
🔄 [UPDATE STATUS] Validando transición: {
  currentStatus: 'en_preparacion',
  newStatus: 'confirmado',
  deliveryType: 'delivery'
}
✅ [UPDATE STATUS] Transición válida, procesando...
✅ [UPDATE STATUS] Estado actualizado exitosamente
```

---

## ✅ Testing Manual

### Prueba 1: Retroceder desde "En Preparación"
1. Crear un pedido nuevo (estado: `pendiente`)
2. Hacer clic en "Comenzar a Preparar"
3. Verificar que pasa a `confirmado` y luego a `en_preparacion`
4. Hacer clic en **"Deshacer (Volver a Confirmado)"**
5. ✅ Verificar que vuelve a `confirmado`

### Prueba 2: Retroceder múltiples veces
1. Crear un pedido nuevo
2. Avanzarlo hasta `listo_para_recoger`
3. Hacer clic en "Deshacer" → Vuelve a `en_preparacion`
4. Hacer clic en "Deshacer" → Vuelve a `confirmado`
5. Hacer clic en "Deshacer" → Vuelve a `pendiente`
6. ✅ Verificar que puede retroceder todo el camino

### Prueba 3: No puede retroceder desde entregado
1. Crear un pedido y avanzarlo hasta `entregado`
2. ❌ Verificar que NO aparece botón "Deshacer"
3. ✅ Verificar que se muestra mensaje de "Pedido entregado"

---

## 📊 Beneficios

1. **Reduce errores humanos:** Los vendedores pueden corregir errores fácilmente
2. **Mejora flexibilidad:** Permite ajustar el flujo según las necesidades del cliente
3. **Aumenta confianza:** Los usuarios no temen "equivocarse" porque pueden deshacer
4. **Mantiene integridad:** Protege estados críticos (entregado, completado) de cambios accidentales

---

## 🚀 Próximos Pasos (Opcional)

Mejoras futuras que podrían implementarse:

1. **Historial de cambios de estado**
   - Registrar quién cambió el estado y cuándo
   - Mostrar línea de tiempo completa con retrocesos

2. **Razón para retroceder**
   - Campo opcional para justificar el retroceso
   - Útil para auditorías

3. **Límite de retrocesos**
   - Permitir solo X retrocesos por pedido
   - Prevenir abuso del sistema

4. **Notificaciones**
   - Alertar al cliente cuando se retrocede un estado
   - Email/SMS automático

---

## 📝 Notas Técnicas

- Los retrocesos NO revierten las operaciones de stock (solo los estados avanzados lo hacen)
- Los timestamps de estados se mantienen (no se borran al retroceder)
- Las transacciones se manejan de forma segura con rollback en caso de error
- El backend valida todas las transiciones antes de permitirlas

---

**Documentos relacionados:**
- [FLUJOS_ESTADO_PEDIDOS.md](FLUJOS_ESTADO_PEDIDOS.md) - Flujos completos de estados
- [RESUMEN_FIXES_PEDIDOS.md](../../farmacia-backend/RESUMEN_FIXES_PEDIDOS.md) - Correcciones del backend

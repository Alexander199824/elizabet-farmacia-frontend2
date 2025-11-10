# API de Notificaciones - Especificación Backend

Este documento describe los endpoints necesarios en el backend para soportar el sistema de notificaciones implementado en el frontend.

## Tabla de Contenidos
1. [Modelo de Datos](#modelo-de-datos)
2. [Endpoints de la API](#endpoints-de-la-api)
3. [Lógica de Negocio](#lógica-de-negocio)
4. [Implementación de Triggers](#implementación-de-triggers)

---

## Modelo de Datos

### Tabla: `notifications`

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userRole ENUM('admin', 'vendedor', 'bodega', 'repartidor', 'cliente') NOT NULL,
  type ENUM(
    'nuevo_pedido',
    'pedido_confirmado',
    'pedido_en_preparacion',
    'pedido_listo',
    'pedido_en_camino',
    'pedido_entregado',
    'pedido_completado',
    'pedido_cancelado',
    'pedido_asignado',
    'stock_bajo',
    'lote_vencimiento',
    'error',
    'exito',
    'advertencia',
    'info'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  relatedOrderId INT NULL,
  relatedProductId INT NULL,
  data JSON NULL, -- Datos adicionales en formato JSON
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (relatedOrderId) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (relatedProductId) REFERENCES products(id) ON DELETE SET NULL,

  INDEX idx_user_unread (userId, isRead),
  INDEX idx_created_at (createdAt),
  INDEX idx_user_role (userId, userRole)
);
```

---

## Endpoints de la API

### 1. Obtener Notificaciones del Usuario Actual

**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional, default: 50): Número máximo de notificaciones a retornar
- `onlyUnread` (opcional, default: false): Solo notificaciones no leídas

**Response 200:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "userId": 5,
      "userRole": "cliente",
      "type": "pedido_confirmado",
      "title": "✅ Pedido Confirmado",
      "message": "Tu pedido #ORD-202501-000123 ha sido confirmado",
      "relatedOrderId": 123,
      "relatedProductId": null,
      "data": {
        "orderId": 123,
        "orderNumber": "ORD-202501-000123"
      },
      "isRead": false,
      "createdAt": "2025-01-07T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Obtener Conteo de Notificaciones No Leídas

**GET** `/api/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "count": 5
}
```

---

### 3. Marcar Notificación como Leída

**PATCH** `/api/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

### 4. Marcar Todas las Notificaciones como Leídas

**PATCH** `/api/notifications/mark-all-read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "updatedCount": 5
}
```

---

### 5. Eliminar Notificación

**DELETE** `/api/notifications/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación eliminada"
}
```

---

### 6. Crear Notificación (Interno)

**POST** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
X-Internal-Request: true (Solo para llamadas internas del servidor)
```

**Body:**
```json
{
  "userId": 5,
  "userRole": "cliente",
  "type": "pedido_confirmado",
  "title": "✅ Pedido Confirmado",
  "message": "Tu pedido #ORD-202501-000123 ha sido confirmado",
  "relatedOrderId": 123,
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-202501-000123"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "userId": 5,
    "type": "pedido_confirmado",
    "title": "✅ Pedido Confirmado",
    "message": "Tu pedido #ORD-202501-000123 ha sido confirmado",
    "isRead": false,
    "createdAt": "2025-01-07T10:30:00.000Z"
  }
}
```

---

## Lógica de Negocio

### Generación Automática de Notificaciones

El backend debe generar notificaciones automáticamente en los siguientes casos:

#### 1. Notificaciones de Pedidos

| Evento | Disparador | Notificar a | Tipo |
|--------|-----------|-------------|------|
| Nuevo pedido creado | `orders.estado = 'pendiente'` | Admin, Vendedores | `nuevo_pedido` |
| Pedido confirmado | `orders.estado = 'confirmado'` | Cliente (dueño del pedido) | `pedido_confirmado` |
| Pedido en preparación | `orders.estado = 'en_preparacion'` | Cliente (dueño del pedido) | `pedido_en_preparacion` |
| Pedido listo (pickup) | `orders.estado = 'listo_para_recoger'` | Cliente (dueño del pedido) | `pedido_listo` |
| Pedido listo (delivery) | `orders.estado = 'listo_para_envio'` | Repartidor asignado | `pedido_listo` |
| Pedido asignado | `orders.repartidorId` cambia | Repartidor asignado | `pedido_asignado` |
| Pedido en camino | `orders.estado = 'en_camino'` | Cliente (dueño del pedido) | `pedido_en_camino` |
| Pedido entregado | `orders.estado = 'entregado'` | Cliente (dueño del pedido) | `pedido_entregado` |
| Pedido completado | `orders.estado = 'completado'` | Cliente (dueño del pedido) | `pedido_completado` |
| Pedido cancelado | `orders.estado = 'cancelado'` | Cliente + Admin/Vendedor | `pedido_cancelado` |

#### 2. Notificaciones de Inventario

| Evento | Disparador | Notificar a | Tipo |
|--------|-----------|-------------|------|
| Stock bajo | `products.cantidadDisponible <= products.stockMinimo` | Admin, Bodega | `stock_bajo` |
| Lote próximo a vencer | `batches.fechaVencimiento <= NOW() + 30 DAYS` | Admin, Bodega | `lote_vencimiento` |

---

## Implementación de Triggers

### Ejemplo: Trigger para Notificaciones de Pedidos

```sql
DELIMITER $$

CREATE TRIGGER after_order_status_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  DECLARE notification_type VARCHAR(50);
  DECLARE notification_title VARCHAR(255);
  DECLARE notification_message TEXT;
  DECLARE target_user_id INT;
  DECLARE target_user_role VARCHAR(20);

  -- Solo ejecutar si cambió el estado
  IF OLD.estado != NEW.estado THEN

    -- Caso 1: Pedido confirmado -> Notificar al cliente
    IF NEW.estado = 'confirmado' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_confirmado';
        SET notification_title = '✅ Pedido Confirmado';
        SET notification_message = CONCAT('Tu pedido #', NEW.numeroPedido, ' ha sido confirmado');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
      END IF;
    END IF;

    -- Caso 2: Pedido en preparación -> Notificar al cliente
    IF NEW.estado = 'en_preparacion' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_en_preparacion';
        SET notification_title = '📦 Pedido en Preparación';
        SET notification_message = CONCAT('Tu pedido #', NEW.numeroPedido, ' está siendo preparado');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
      END IF;
    END IF;

    -- Caso 3: Pedido listo para recoger -> Notificar al cliente
    IF NEW.estado = 'listo_para_recoger' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_listo';
        SET notification_title = '✨ Pedido Listo';
        SET notification_message = CONCAT('Tu pedido #', NEW.numeroPedido, ' está listo para recoger');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido, 'deliveryType', 'pickup'));
      END IF;
    END IF;

    -- Caso 4: Pedido listo para envío -> Notificar al repartidor
    IF NEW.estado = 'listo_para_envio' THEN
      IF NEW.repartidorId IS NOT NULL THEN
        SET target_user_id = NEW.repartidorId;
        SET target_user_role = 'repartidor';
        SET notification_type = 'pedido_listo';
        SET notification_title = '✨ Pedido Listo para Envío';
        SET notification_message = CONCAT('Pedido #', NEW.numeroPedido, ' listo para envío');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido, 'deliveryType', 'delivery'));
      END IF;
    END IF;

    -- Caso 5: Pedido en camino -> Notificar al cliente
    IF NEW.estado = 'en_camino' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_en_camino';
        SET notification_title = '🚚 Pedido en Camino';
        SET notification_message = CONCAT('Tu pedido #', NEW.numeroPedido, ' está en camino');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
      END IF;
    END IF;

    -- Caso 6: Pedido entregado -> Notificar al cliente
    IF NEW.estado = 'entregado' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_entregado';
        SET notification_title = '🎉 Pedido Entregado';
        SET notification_message = CONCAT('Tu pedido #', NEW.numeroPedido, ' ha sido entregado');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
      END IF;
    END IF;

    -- Caso 7: Pedido cancelado -> Notificar al cliente
    IF NEW.estado = 'cancelado' THEN
      IF NEW.clienteId IS NOT NULL THEN
        SET target_user_id = NEW.clienteId;
        SET target_user_role = 'cliente';
        SET notification_type = 'pedido_cancelado';
        SET notification_title = '❌ Pedido Cancelado';
        SET notification_message = CONCAT('El pedido #', NEW.numeroPedido, ' ha sido cancelado');

        INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
        VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
                JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido, 'reason', NEW.motivoCancelacion));
      END IF;
    END IF;

  END IF;

  -- Notificar si cambió el repartidor asignado
  IF (OLD.repartidorId IS NULL OR OLD.repartidorId != NEW.repartidorId) AND NEW.repartidorId IS NOT NULL THEN
    SET target_user_id = NEW.repartidorId;
    SET target_user_role = 'repartidor';
    SET notification_type = 'pedido_asignado';
    SET notification_title = '📍 Nuevo Pedido Asignado';
    SET notification_message = CONCAT('Se te ha asignado el pedido #', NEW.numeroPedido, ' para entrega');

    INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
    VALUES (target_user_id, target_user_role, notification_type, notification_title, notification_message, NEW.id,
            JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
  END IF;

END$$

DELIMITER ;
```

### Trigger para Notificar a Admin/Vendedores sobre Nuevos Pedidos

```sql
DELIMITER $$

CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  DECLARE admin_user_id INT;
  DECLARE vendedor_user_id INT;

  -- Notificar a todos los administradores
  FOR admin_user IN (SELECT id FROM users WHERE rol = 'admin')
  DO
    INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
    VALUES (admin_user.id, 'admin', 'nuevo_pedido', '🛒 Nuevo Pedido',
            CONCAT('Pedido #', NEW.numeroPedido, ' recibido'), NEW.id,
            JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
  END FOR;

  -- Notificar a todos los vendedores
  FOR vendedor_user IN (SELECT id FROM users WHERE rol = 'vendedor')
  DO
    INSERT INTO notifications (userId, userRole, type, title, message, relatedOrderId, data)
    VALUES (vendedor_user.id, 'vendedor', 'nuevo_pedido', '🛒 Nuevo Pedido',
            CONCAT('Pedido #', NEW.numeroPedido, ' recibido'), NEW.id,
            JSON_OBJECT('orderId', NEW.id, 'orderNumber', NEW.numeroPedido));
  END FOR;
END$$

DELIMITER ;
```

---

## Alternativa: Implementación en Controladores

Si prefieres no usar triggers de base de datos, puedes implementar la lógica en los controladores:

### Ejemplo en Node.js/Express

```javascript
// orderController.js

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estado } = req.body;

    const order = await Order.findById(orderId);
    const oldStatus = order.estado;

    // Actualizar el estado
    order.estado = estado;
    await order.save();

    // Generar notificación según el cambio de estado
    await generateOrderNotification(order, oldStatus, estado);

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateOrderNotification = async (order, oldStatus, newStatus) => {
  let notifications = [];

  switch (newStatus) {
    case 'confirmado':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_confirmado',
          title: '✅ Pedido Confirmado',
          message: `Tu pedido #${order.numeroPedido} ha sido confirmado`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido }
        });
      }
      break;

    case 'en_preparacion':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_en_preparacion',
          title: '📦 Pedido en Preparación',
          message: `Tu pedido #${order.numeroPedido} está siendo preparado`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido }
        });
      }
      break;

    case 'listo_para_recoger':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_listo',
          title: '✨ Pedido Listo',
          message: `Tu pedido #${order.numeroPedido} está listo para recoger`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido, deliveryType: 'pickup' }
        });
      }
      break;

    case 'listo_para_envio':
      if (order.repartidorId) {
        notifications.push({
          userId: order.repartidorId,
          userRole: 'repartidor',
          type: 'pedido_listo',
          title: '✨ Pedido Listo para Envío',
          message: `Pedido #${order.numeroPedido} listo para envío`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido, deliveryType: 'delivery' }
        });
      }
      break;

    case 'en_camino':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_en_camino',
          title: '🚚 Pedido en Camino',
          message: `Tu pedido #${order.numeroPedido} está en camino`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido }
        });
      }
      break;

    case 'entregado':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_entregado',
          title: '🎉 Pedido Entregado',
          message: `Tu pedido #${order.numeroPedido} ha sido entregado`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido }
        });
      }
      break;

    case 'cancelado':
      if (order.clienteId) {
        notifications.push({
          userId: order.clienteId,
          userRole: 'cliente',
          type: 'pedido_cancelado',
          title: '❌ Pedido Cancelado',
          message: `El pedido #${order.numeroPedido} ha sido cancelado`,
          relatedOrderId: order.id,
          data: { orderId: order.id, orderNumber: order.numeroPedido, reason: order.motivoCancelacion }
        });
      }
      break;
  }

  // Crear todas las notificaciones
  for (const notificationData of notifications) {
    await Notification.create(notificationData);
  }
};
```

---

## Notas de Implementación

1. **Sistema Híbrido**: Por ahora, el frontend usa `localStorage` como fallback. Una vez implementados los endpoints del backend, el sistema automáticamente intentará usar la API primero y solo usará `localStorage` si la API falla.

2. **WebSockets (Opcional)**: Para notificaciones en tiempo real sin polling, considera implementar WebSockets usando Socket.IO:
   ```javascript
   // Cuando se crea una notificación
   io.to(`user_${userId}`).emit('new_notification', notification);
   ```

3. **Limpieza de Notificaciones Antiguas**: Implementa un cron job para eliminar notificaciones antiguas:
   ```sql
   DELETE FROM notifications
   WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY) AND isRead = TRUE;
   ```

4. **Índices de Base de Datos**: Asegúrate de tener índices en las columnas más consultadas para optimizar el rendimiento.

5. **Permisos**: Los usuarios solo deben poder ver, actualizar y eliminar sus propias notificaciones.

---

## Checklist de Implementación

- [ ] Crear tabla `notifications` en la base de datos
- [ ] Implementar endpoints GET `/api/notifications`
- [ ] Implementar endpoint GET `/api/notifications/unread-count`
- [ ] Implementar endpoint PATCH `/api/notifications/:id/read`
- [ ] Implementar endpoint PATCH `/api/notifications/mark-all-read`
- [ ] Implementar endpoint DELETE `/api/notifications/:id`
- [ ] Implementar lógica de generación automática de notificaciones (triggers o controladores)
- [ ] Agregar middleware de autenticación a todos los endpoints
- [ ] Agregar validación de permisos (usuarios solo pueden acceder a sus notificaciones)
- [ ] Probar flujo completo de notificaciones para cada rol
- [ ] (Opcional) Implementar WebSockets para notificaciones en tiempo real
- [ ] (Opcional) Implementar cron job para limpieza de notificaciones antiguas

---

**Nota**: Una vez implementados los endpoints del backend, actualiza el archivo `.env` del frontend con la URL correcta del backend:

```
VITE_API_URL=http://localhost:3000/api
```

El frontend está configurado para usar automáticamente la API del backend cuando esté disponible.

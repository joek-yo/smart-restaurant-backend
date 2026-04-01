// 📁 File: src/domains/orders/index.ts

// ✅ Module
// export * from './orders.module'; // ❌ Removed because OrdersModule moved to interfaces

// DTOs
export * from './dto/create-order.dto';
export * from './dto/update-order-status.dto';

// Schemas & Enums
export * from './schemas/order.schema';
export * from './entities/order-status.enum';

// Events
export * from './events/order-created.event';
export * from './events/order-status-updated.event';

// ✅ Domain Entities (renamed to avoid duplicate export)
export {
  Order as OrderEntity,
  OrderItem as OrderItemEntity,
} from './entities/order.entity';
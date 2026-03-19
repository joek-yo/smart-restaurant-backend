// src/modules/orders/orders.gateway.ts
import { WebSocketGateway } from '@nestjs/websockets';
import { OrderDocument } from './schemas/order.schema';

@WebSocketGateway()
export class OrdersGateway {

  emitOrderCreated(order: OrderDocument) {
    // Now _id is known to exist
    console.log('Order created (stub):', order._id);
  }
}
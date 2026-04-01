// src/domains/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { EventBus } from '../../common/events/event-bus';

@Injectable()
export class NotificationsService {
  constructor(private readonly eventBus: EventBus) {
    // Listen for new orders
    this.eventBus.on('order.created', (payload: any) => {
      console.log('Notify admin or WhatsApp for new order:', payload);
      // TODO: integrate real notification logic here
    });

    // Listen for new customers
    this.eventBus.on('customer.created', (payload: any) => {
      console.log('Send welcome message or log analytics:', payload);
      // TODO: integrate real notification logic here
    });
  }
}
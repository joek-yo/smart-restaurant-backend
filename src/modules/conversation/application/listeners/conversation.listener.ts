import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CONVERSATION_EVENTS } from '@core/events/event.constants';

@Injectable()
export class ConversationEventListener {
  
  @OnEvent(CONVERSATION_EVENTS.ORDER_REQUESTED)
  async handleOrderRequest(payload: any) {
    console.log('--- [ORDER MODULE TRIGGER] ---');
    console.log(`Creating order for User: ${payload.userId} in Tenant: ${payload.tenantId}`);
    // This is where you'd call OrdersService.create()
  }

  @OnEvent(CONVERSATION_EVENTS.CART_UPDATED)
  async handleCartUpdate(payload: any) {
    console.log('--- [SESSIONS MODULE TRIGGER] ---');
    console.log(`Syncing cart for session: ${payload.userId}`);
    // Sync logic here
  }
}

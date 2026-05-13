// FILE: src/modules/whatsapp/whatsapp.module.ts
//
// Phase 4 — WhatsApp is now TRANSPORT ONLY.
// All logic lives in conversation/infrastructure/adapters/whatsapp/
// This module exists only to host the WebSocket gateway.

import { Module } from '@nestjs/common';
import { CoreEventModule } from '@core/events/core-event.module';
import { ConversationModule } from '@modules/conversation/conversation.module';
import { CheckoutModule } from '@modules/checkout/checkout.module';
import { WhatsappGateway } from './gateway/whatsapp.gateway';

@Module({
  imports: [
    CoreEventModule,
    ConversationModule,
    CheckoutModule,
  ],
  providers: [
    WhatsappGateway,
  ],
  exports: [
    WhatsappGateway,
  ],
})
export class WhatsAppModule {}

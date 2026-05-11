// src/modules/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { CoreEventModule } from '@core/events/core-event.module';
import { ConversationModule } from '../conversation/conversation.module';
import { CheckoutModule } from '@modules/checkout/checkout.module';
import { WhatsappGateway } from './gateway/whatsapp.gateway';
import { ProcessOrderHandler } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';

@Module({
  imports: [
    CoreEventModule,
    ConversationModule,
    CheckoutModule,
  ],
  providers: [
    WhatsappGateway,
    ProcessOrderHandler,
    SendReplyUseCase,
  ],
  exports: [WhatsappGateway],
})
export class WhatsAppModule {}
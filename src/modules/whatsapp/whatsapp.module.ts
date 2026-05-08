// src/modules/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { WhatsappGateway } from './gateway/whatsapp.gateway';
import { ProcessOrderUseCase } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';
import { AddToCartUseCase } from '../sessions/application/use-cases/add-to-cart.use-case';
import { CheckoutUseCase } from '../sessions/application/use-cases/checkout.use-case';

@Module({
  imports: [SessionsModule],
  providers: [
    WhatsappGateway,
    ProcessOrderUseCase,
    SendReplyUseCase,
    AddToCartUseCase,
    CheckoutUseCase,
  ],
  exports: [WhatsappGateway],
})
export class WhatsAppModule {}

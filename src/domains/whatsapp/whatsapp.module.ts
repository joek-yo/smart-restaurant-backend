// 📁 File: src/modules/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';

// ✅ Keep sessions (assuming still in modules/)
import { SessionsModule } from '../sessions/sessions.module';

// ✅ FIXED: point to new interfaces layer
import { OrdersModule } from '../../interfaces/orders/orders.module';

import { WhatsappGateway } from './whatsapp.gateway';

// Use-cases
import { AddToCartUseCase } from '../sessions/use-cases/add-to-cart';
import { CheckoutSessionUseCase } from '../sessions/use-cases/checkout-session';

// Handlers (rename if needed later)
import { ProcessOrderUseCase } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';

@Module({
  imports: [
    SessionsModule,
    OrdersModule, // ✅ now correct
  ],
  providers: [
    WhatsappGateway,
    AddToCartUseCase,
    CheckoutSessionUseCase,
    ProcessOrderUseCase,
    SendReplyUseCase,
  ],
  exports: [WhatsappGateway],
})
export class WhatsAppModule {}
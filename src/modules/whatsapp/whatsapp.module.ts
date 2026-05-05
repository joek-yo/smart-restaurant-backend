// src/modules/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { WhatsappGateway } from './gateway/whatsapp.gateway';
import { ProcessOrderUseCase } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';

@Module({
  imports: [SessionsModule],
  providers: [
    WhatsappGateway,
    ProcessOrderUseCase,
    SendReplyUseCase,
  ],
  exports: [WhatsappGateway],
})
export class WhatsAppModule {}

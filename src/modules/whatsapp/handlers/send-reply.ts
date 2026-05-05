// src/modules/whatsapp/handlers/send-reply.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SendReplyUseCase {
  execute(phone: string, message: string) {
    return { phone, message };
  }
}

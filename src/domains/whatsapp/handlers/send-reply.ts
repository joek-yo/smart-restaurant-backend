// src/modules/whatsapp/handlers/send-reply.ts
import { Injectable } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';

@Injectable()
export class SendReplyUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Sends a formatted reply message to a phone number
   * (Gateway will emit this to the client)
   */
  execute(phone: string, message: string) {
    const session = this.sessionsService.getSession(phone);

    // Here you could format messages or include dynamic buttons/templates
    return {
      phone,
      step: session.step,
      message,
    };
  }
}
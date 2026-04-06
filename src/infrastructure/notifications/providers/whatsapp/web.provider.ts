// src/infrastructure/notifications/providers/whatsapp/web.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebWhatsAppProvider {
  private readonly logger = new Logger(WebWhatsAppProvider.name);

  async sendMessage(input: { to: string; message: string }) {
    this.logger.log(
      `(MOCK) Sending WEB WhatsApp message → ${input.to}: ${input.message}`,
    );
  }
}
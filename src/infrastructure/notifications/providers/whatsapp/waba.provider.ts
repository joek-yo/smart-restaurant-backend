// src/infrastructure/notifications/providers/whatsapp/waba.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WabaProvider {
  private readonly logger = new Logger(WabaProvider.name);

  async sendText(input: { to: string; message: string }) {
    this.logger.log(`(MOCK) Sending TEXT to ${input.to}: ${input.message}`);
  }

  async sendTemplate(input: {
    to: string;
    templateName: string;
    params: Record<string, any>;
  }) {
    this.logger.log(
      `(MOCK) Sending TEMPLATE to ${input.to}: ${input.templateName}`,
    );
  }
}
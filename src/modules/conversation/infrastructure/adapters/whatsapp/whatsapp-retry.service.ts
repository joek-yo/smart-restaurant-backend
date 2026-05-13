// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-retry.service.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsAppRetryService {
  private readonly logger = new Logger(WhatsAppRetryService.name);

  async execute<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 300): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const delay = baseDelayMs * Math.pow(2, attempt);
        this.logger.warn(`[WhatsAppRetry] attempt=${attempt + 1} delay=${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    throw lastError;
  }
}

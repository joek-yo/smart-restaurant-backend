// src/modules/whatsapp/handlers/process-order.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessOrderUseCase {
  async execute(phone: string): Promise<string> {
    // TODO: wire to CreateOrderFromSessionUseCase when ready
    console.log(`[WhatsApp] Processing order for ${phone}`);
    return `✅ Order successfully placed! Thank you.`;
  }
}

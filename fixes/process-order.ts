// src/modules/whatsapp/handlers/process-order.ts
//
// ✅ FIX 3 — Wired to CheckoutOrchestratorService via event, not direct call.
// WhatsApp layer emits a commerce command; orchestrator handles the pipeline.

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@core/events';

export interface ProcessOrderContext {
  phone: string;
  tenantId: string;
  sessionId: string;
}

@Injectable()
export class ProcessOrderHandler {
  private readonly logger = new Logger(ProcessOrderHandler.name);

  constructor(private readonly eventBus: EventBus) {}

  async execute(ctx: ProcessOrderContext): Promise<string> {
    const { phone, tenantId, sessionId } = ctx;

    this.logger.log(
      `[ProcessOrder] Emitting order.requested for phone=${phone} tenant=${tenantId} session=${sessionId}`,
    );

    // Emit commerce event — CheckoutOrchestratorService listens and handles
    this.eventBus.emit('order.requested', {
      userId: phone,
      tenantId,
      sessionId,
      channel: 'whatsapp',
      requestedAt: new Date(),
    });

    return '✅ Your order has been received! We\'ll confirm it shortly.';
  }
}
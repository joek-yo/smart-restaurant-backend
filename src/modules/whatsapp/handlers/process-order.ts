// src/modules/whatsapp/handlers/process-order.ts

import { Injectable, Logger } from '@nestjs/common';
import { CheckoutOrchestratorService } from '@modules/checkout/application/orchestrators/checkout-orchestrator.service';

export interface ProcessOrderContext {
  phone: string;
  tenantId: string;
  sessionId: string;
}

@Injectable()
export class ProcessOrderHandler {
  private readonly logger = new Logger(ProcessOrderHandler.name);

  constructor(
    private readonly checkoutOrchestrator: CheckoutOrchestratorService,
  ) {}

  async execute(ctx: ProcessOrderContext): Promise<string> {
    const { phone, tenantId, sessionId } = ctx;

    this.logger.log(
      `[ProcessOrder] Confirming checkout for phone=${phone} tenant=${tenantId} session=${sessionId}`,
    );

    await this.checkoutOrchestrator.confirmCheckout({
      userId: phone,
      tenantId,
      sessionId,
      channel: 'whatsapp',
    });

    return "✅ Your order has been received! We'll confirm it shortly.";
  }
}
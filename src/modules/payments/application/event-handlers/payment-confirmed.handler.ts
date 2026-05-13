// FILE: src/modules/payments/application/event-handlers/payment-confirmed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';
import { PAYMENT_EVENTS, CHECKOUT_EVENTS } from '@core/events/event.constants';

import { OrdersService } from '@modules/orders/orders.service';
import { WhatsappGateway } from '@modules/whatsapp/gateway/whatsapp.gateway';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

/**
 * PaymentConfirmedHandler
 * ------------------------
 * Side-effect engine for successful payments.
 *
 * TRIGGERS:
 * - Order activation / state transition
 * - WhatsApp confirmation message
 * - Analytics / tracking hooks (future)
 */
@Injectable()
export class PaymentConfirmedHandler implements OnModuleInit {
  private readonly logger = new Logger(PaymentConfirmedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly ordersService: OrdersService,
    private readonly whatsappGateway: WhatsappGateway,
  ) {}

  onModuleInit() {
    this.eventBus.on(PAYMENT_EVENTS.PAYMENT_CONFIRMED, this.handle.bind(this));
  }

  async handle(event: {
    paymentId: string;
    tenantId: string;
    orderId: string;
    amount: number;
    provider: string;
    providerRef?: string;
    confirmedAt: Date;
  }) {
    this.logger.log(
      `[PaymentConfirmed] payment=${event.paymentId} order=${event.orderId} tenant=${event.tenantId}`,
    );

    // =========================
    // 1. ACTIVATE ORDER
    // =========================
    if (event.orderId) {
      await this.ordersService.updateStatus(event.orderId, { status: OrderStatus.ACCEPTED });
    }

    // =========================
    // 2. WHATSAPP NOTIFICATION
    // =========================
    await this.whatsappGateway.server?.emit('outgoingMessage', {
      tenantId: event.tenantId,
      message: `✅ Payment received successfully!\nOrder ${event.orderId} is now confirmed.`,
      meta: {
        paymentId: event.paymentId,
        amount: event.amount,
      },
    });

    // =========================
    // 3. ANALYTICS HOOK (FUTURE)
    // =========================
    // TODO:
    // - revenue tracking
    // - cohort analysis
    // - conversion funnel updates
  }
}
import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  async handleOrderCreated(payload: {
    orderId: string;
    businessId: string;
    totalAmount: number;
    customerId: string;
    source: string;
    timestamp: string;
  }) {
    this.logger.log(
      `[ORDER_CREATED] cleaning checkout state for customer=${payload.customerId}`,
    );
    try {
      const session = await this.sessionPort.getSession({
        userId: payload.customerId,
        tenantId: payload.businessId,
      });

      if (!session) {
        this.logger.warn(`[ORDER_CREATED] no session found for user=${payload.customerId}`);
        return;
      }

      session.clearCart();
      await this.sessionPort.save(session);

      this.logger.log(`[ORDER_CREATED] session reset completed user=${payload.customerId}`);
    } catch (err) {
      this.logger.error(
        `[ORDER_CREATED] cleanup failed for user=${payload.customerId}`,
        err as any,
      );
    }
  }
}

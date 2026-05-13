import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';
import { SessionState } from '@modules/sessions/domain/value-objects/session-state.vo';

@Injectable()
export class PaymentFailedListener {
  private readonly logger = new Logger(PaymentFailedListener.name);

  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  async handlePaymentFailed(payload: {
    orderId?: string;
    userId: string;
    tenantId: string;
    reason?: string;
  }) {
    this.logger.warn(
      `[PAYMENT_FAILED] user=${payload.userId} reason=${payload.reason ?? 'unknown'}`,
    );
    try {
      const session = await this.sessionPort.getOrCreate(
        payload.userId,
        payload.tenantId,
      );

      if (!session) {
        this.logger.warn(`[PAYMENT_FAILED] no session found user=${payload.userId}`);
        return;
      }

      session.state.set(SessionState.CHECKOUT);
      session.markRecovered(`payment_failed:${payload.reason ?? 'unknown'}`);

      await this.sessionPort.save(session);

      this.logger.log(`[PAYMENT_FAILED] session restored to CHECKOUT user=${payload.userId}`);
    } catch (err) {
      this.logger.error(`[PAYMENT_FAILED] recovery failed user=${payload.userId}`, err as any);
    }
  }
}

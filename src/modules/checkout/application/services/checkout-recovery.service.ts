import { Injectable, Logger } from '@nestjs/common';
import { CheckoutSessionPort } from '../ports/checkout-session.port';
import { SessionState } from '@modules/sessions/domain/value-objects/session-state.vo';

@Injectable()
export class CheckoutRecoveryService {
  private readonly logger = new Logger(CheckoutRecoveryService.name);

  constructor(private readonly sessionPort: CheckoutSessionPort) {}

  async restoreToCheckout(input: {
    userId: string;
    tenantId: string;
    reason: 'PAYMENT_FAILED' | 'ABANDONED' | 'TIMEOUT' | 'RECONNECT';
  }) {
    const session = await this.sessionPort.getOrCreate(input.userId, input.tenantId);

    if (!session) {
      this.logger.warn(`[RECOVERY] No session found user=${input.userId}`);
      return { recovered: false, reason: 'NO_SESSION' };
    }

    if (!session.items || session.items.length === 0) {
      return { recovered: false, reason: 'EMPTY_CART' };
    }

    session.state.set(SessionState.CHECKOUT);
    session.markRecovered(input.reason);

    await this.sessionPort.save(session);

    this.logger.log(
      `[RECOVERY] user=${input.userId} reason=${input.reason} items=${session.items.length}`,
    );

    return {
      recovered: true,
      sessionId: session.id,
      state: session.state.value,
      items: session.items.length,
    };
  }

  async softRecover(input: { userId: string; tenantId: string }) {
    const session = await this.sessionPort.getOrCreate(input.userId, input.tenantId);

    if (!session) return { recovered: false, reason: 'NO_SESSION' };

    const recoverableStates: string[] = [SessionState.EXPIRED, 'ABANDONED'];

    if (recoverableStates.includes(session.state.value)) {
      session.state.set(SessionState.CART_UPDATED);
      await this.sessionPort.save(session);
      this.logger.log(`[SOFT_RECOVERY] user=${input.userId} restored to CART`);
      return { recovered: true, mode: 'SOFT' };
    }

    return { recovered: false, reason: 'NO_RECOVERY_NEEDED' };
  }
}

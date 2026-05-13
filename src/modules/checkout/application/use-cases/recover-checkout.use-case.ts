import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';
import { SessionState } from '@modules/sessions/domain/value-objects/session-state.vo';

@Injectable()
export class RecoverCheckoutUseCase {
  private readonly logger = new Logger(RecoverCheckoutUseCase.name);

  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionPort.getOrCreate(
      input.userId,
      input.tenantId,
      input.branchId,
    );

    const lockedStates: string[] = ['ORDER_CONFIRMED'];
    if (lockedStates.includes(session.state?.value ?? '')) {
      throw new BadRequestException(
        `Cannot recover checkout in state: ${session.state?.value}`,
      );
    }

    const currentState = session.state?.value ?? '';
    const isAbandoned =
      currentState === SessionState.CART_UPDATED || currentState === SessionState.CHECKOUT;
    const hasItems = session.items && session.items.length > 0;

    if (isAbandoned && hasItems) {
      this.logger.log(`[RECOVERY] Restoring abandoned checkout for user=${input.userId}`);

      session.state.set(SessionState.CART_UPDATED);
      session.markRecovered('checkout_recovery');

      await this.sessionPort.save(session);

      return {
        recovered: true,
        sessionId: session.id,
        state: session.state.value,
        itemsCount: session.items.length,
        recovery: session.recovery,
      };
    }

    return {
      recovered: false,
      sessionId: session.id,
      state: session.state.value,
      reason: hasItems ? 'session_active' : 'empty_cart',
    };
  }
}

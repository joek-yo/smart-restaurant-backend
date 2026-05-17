import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CHECKOUT_EVENTS, CONVERSATION_EVENTS } from '@core/events/event.constants';

import { CheckoutOrchestratorService } from '../orchestrators/checkout-orchestrator.service';
import { RecoverCheckoutSessionUseCase } from '../use-cases/recover-checkout-session.use-case';

@Injectable()
export class ConversationCheckoutListener {
  private readonly logger = new Logger(ConversationCheckoutListener.name);

  constructor(
    private readonly checkout: CheckoutOrchestratorService,
    private readonly recoverCheckout: RecoverCheckoutSessionUseCase,
  ) {}

  @OnEvent(CHECKOUT_EVENTS.CHECKOUT_STARTED)
  async onCheckoutStarted(payload: {
    userId: string;
    tenantId: string;
    channel: string;
  }) {
    this.logger.log(`[EVENT] checkout.started user=${payload.userId}`);
    await this.checkout.startCheckout({
      userId: payload.userId,
      tenantId: payload.tenantId,
      channel: payload.channel,
    });
  }

  @OnEvent(CONVERSATION_EVENTS.STATE_CHANGED)
  async onStateChanged(payload: {
    userId: string;
    tenantId: string;
    state: string;
  }) {
    const recoverableStates = ['ABANDONED', 'EXPIRED', 'RECOVERY_FLOW'];
    if (!recoverableStates.includes(payload.state)) return;
    this.logger.log(`[EVENT] recovery.trigger user=${payload.userId}`);
    await this.recoverCheckout.execute({
      userId: payload.userId,
      tenantId: payload.tenantId,
    });
  }

  @OnEvent(CONVERSATION_EVENTS.ORDER_CONFIRMATION_REQUESTED)
  async onOrderRequested(payload: {
    userId: string;
    tenantId: string;
    channel: string;
  }) {
    this.logger.log(`[EVENT] order.requested user=${payload.userId}`);
    await this.checkout.confirmCheckout({
      userId: payload.userId,
      tenantId: payload.tenantId,
      channel: payload.channel,
    });
  }
}

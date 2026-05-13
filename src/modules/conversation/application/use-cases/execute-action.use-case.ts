// src/modules/conversation/application/use-cases/execute-action.use-case.ts
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';
import { StartCheckoutUseCase } from '@modules/checkout/application/use-cases/start-checkout.use-case';
import { ConfirmCheckoutUseCase } from '@modules/checkout/application/use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from '@modules/checkout/application/use-cases/cancel-checkout.use-case';

@Injectable()
export class ExecuteActionUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly startCheckout: StartCheckoutUseCase,
    private readonly confirmCheckout: ConfirmCheckoutUseCase,
    private readonly cancelCheckout: CancelCheckoutUseCase,
  ) {}

  async execute(input: {
    tenantId: string;
    userId: string;
    intent: string;
    sessionId?: string;
    productId?: string;
    message?: string;
  }): Promise<void> {
    const sessionId = input.sessionId ?? input.userId;

    switch (input.intent) {
      case 'ADD_TO_CART':
        // no-op here — cart add requires product details, handled by dedicated use case
        return;

      case 'REMOVE_FROM_CART':
        if (input.productId) {
          await this.sessionService.removeItem(sessionId, input.productId);
        }
        return;

      case 'CLEAR_CART':
        await this.sessionService.clear(sessionId);
        return;

      case 'VIEW_CART':
        return;

      case 'CHECKOUT':
        await this.startCheckout.execute({
          userId: input.userId,
          tenantId: input.tenantId,
        });
        return;

      case 'CONFIRM_ORDER':
        await this.confirmCheckout.execute({
          userId: input.userId,
          tenantId: input.tenantId,
        });
        return;

      case 'CANCEL_ORDER':
        await this.cancelCheckout.execute({
          userId: input.userId,
          tenantId: input.tenantId,
        });
        return;

      case 'ASK_HELP':
      case 'SMALL_TALK':
      default:
        return;
    }
  }
}

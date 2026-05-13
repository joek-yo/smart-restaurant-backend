import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { StartCheckoutUseCase } from '@modules/checkout/application/use-cases/start-checkout.use-case';

@Injectable()
export class CheckoutAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.CHECKOUT;
  private readonly logger = new Logger(CheckoutAction.name);

  constructor(
    private readonly registry: ActionRegistry,
    private readonly startCheckout: StartCheckoutUseCase,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register('checkout', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    const { tenantId, userId } = ctx.input;
    this.logger.debug(`[CheckoutAction] starting checkout for user=${userId}`);
    try {
      await this.startCheckout.execute({ tenantId, userId });
      ctx.output = { response: '✅ Checkout started! Please confirm your order to proceed.' };
    } catch (err: any) {
      this.logger.warn(`[CheckoutAction] failed: ${err.message}`);
      ctx.output = { response: `❌ ${err.message ?? 'Could not start checkout. Please try again.'}` };
    }
  }
}

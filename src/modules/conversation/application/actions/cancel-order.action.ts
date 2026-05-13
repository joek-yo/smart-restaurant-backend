import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { CancelCheckoutUseCase } from '@modules/checkout/application/use-cases/cancel-checkout.use-case';

@Injectable()
export class CancelOrderAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.CANCEL_ORDER;
  private readonly logger = new Logger(CancelOrderAction.name);

  constructor(
    private readonly registry: ActionRegistry,
    private readonly cancelCheckout: CancelCheckoutUseCase,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register('cancel-order', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    const { tenantId, userId } = ctx.input;
    try {
      await this.cancelCheckout.execute({ userId, tenantId });
      ctx.output = { response: '❌ Your order has been cancelled.' };
    } catch (err: any) {
      ctx.output = { response: '⚠️ Nothing to cancel right now.' };
    }
  }
}

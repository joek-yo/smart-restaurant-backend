import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';

@Injectable()
export class AddToCartAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.ADD_TO_CART;
  private readonly logger = new Logger(AddToCartAction.name);

  constructor(private readonly registry: ActionRegistry) {
    super();
  }

  onModuleInit() {
    this.registry.register('add-to-cart', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    this.logger.debug(`[AddToCartAction] user=${ctx.input?.userId} message="${ctx.input?.message}"`);
    ctx.actionResult = {
      type: 'ADD_TO_CART',
      status: 'pending_product_selection',
      message: ctx.input?.message,
    };
    ctx.output = {
      response: '🛒 Which item would you like to add? Please specify the product name.',
    };
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';

@Injectable()
export class ViewCartAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.VIEW_CART;

  constructor(private readonly registry: ActionRegistry) {
    super();
  }

  onModuleInit() {
    this.registry.register('view-cart', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    ctx.output = {
      response: '🛒 Here is your current cart. Reply "checkout" to place your order.',
    };
  }
}

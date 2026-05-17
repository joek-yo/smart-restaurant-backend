import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';

@Injectable()
export class ViewProductsAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.VIEW_PRODUCTS;

  constructor(private readonly registry: ActionRegistry) {
    super();
  }

  onModuleInit() {
    this.registry.register('view-products', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    ctx.output = {
      response: '📋 Here is our catalog! Reply with the item name or number to add to your cart.',
    };
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { PipelineContext } from '../pipelines/middleware.pipeline';

@Injectable()
export class SendMessageAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.UNKNOWN;

  constructor(private readonly registry: ActionRegistry) {
    super();
  }

  onModuleInit() {
    this.registry.register('send-message', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    ctx.output = { response: ctx.fallbackResponse ?? 'How can I help you?' };
  }
}

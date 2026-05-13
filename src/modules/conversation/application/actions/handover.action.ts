import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';

@Injectable()
export class HandoverAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.UNKNOWN;

  constructor(private readonly registry: ActionRegistry) {
    super();
  }

  onModuleInit() {
    this.registry.register('handover', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    ctx.output = {
      response: "You've been connected to a live agent. Someone will be with you shortly. 🙋",
    };
  }
}

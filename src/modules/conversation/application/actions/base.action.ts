// FILE: src/modules/conversation/application/actions/base.action.ts

import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';

export abstract class BaseAction {
  abstract intent: ConversationIntent;
  abstract execute(ctx: PipelineContext): Promise<void>;
}

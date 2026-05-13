// FILE: src/modules/conversation/application/pipelines/inbound-message.pipeline.ts

import { Injectable } from '@nestjs/common';
import { MiddlewarePipeline, PipelineContext } from './middleware.pipeline';

/**
 * INBOUND PIPELINE
 * ----------------
 * Stages:
 * 1. Validate & normalize input
 * 2. Load context
 * 3. Resolve intent
 * 4. Execute action
 * 5. Persist context
 * 6. Build response
 * 7. Emit events
 */
@Injectable()
export class InboundMessagePipeline {
  async run(input: {
    tenantId: string;
    userId: string;
    message: string;
    channel: string;
    messageId?: string;
    metadata?: Record<string, any>;
  }): Promise<PipelineContext> {
    const pipeline = new MiddlewarePipeline();
    const ctx: PipelineContext = { input, output: null, errors: [] };

    // Stages are registered by the engine — pipeline is just the runner
    return pipeline.run(ctx);
  }
}

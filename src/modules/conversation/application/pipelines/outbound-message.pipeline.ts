// FILE: src/modules/conversation/application/pipelines/outbound-message.pipeline.ts

import { Injectable } from '@nestjs/common';
import { MiddlewarePipeline, PipelineContext } from './middleware.pipeline';

@Injectable()
export class OutboundMessagePipeline {
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const pipeline = new MiddlewarePipeline();
    return pipeline.run(ctx);
  }
}

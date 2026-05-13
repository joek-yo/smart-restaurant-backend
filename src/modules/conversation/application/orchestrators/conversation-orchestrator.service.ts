// FILE: src/modules/conversation/application/orchestrators/conversation-orchestrator.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConversationPipelineEngine, PipelineInput, PipelineResult } from '../pipelines/conversation.pipeline.engine';

/**
 * ConversationOrchestratorService
 * --------------------------------
 * PURE COORDINATOR — owns nothing, executes nothing.
 * Single responsibility: delegate to the pipeline engine.
 *
 * Entry point for all inbound messages regardless of channel.
 */
@Injectable()
export class ConversationOrchestratorService {
  private readonly logger = new Logger(ConversationOrchestratorService.name);

  constructor(
    private readonly pipelineEngine: ConversationPipelineEngine,
  ) {}

  async execute(input: PipelineInput): Promise<PipelineResult> {
    this.logger.log(
      `[Orchestrator] Processing → tenant=${input.tenantId} user=${input.userId} channel=${input.channel}`,
    );
    return this.pipelineEngine.process(input);
  }
}

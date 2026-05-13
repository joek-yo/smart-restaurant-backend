// FILE: src/modules/protection/application/pipelines/workflow-validation.pipeline.ts

import { Injectable } from '@nestjs/common';

import { ValidateWorkflowConsistencyUseCase } from '../use-cases/validate-workflow-consistency.use-case';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * WorkflowValidationPipeline
 * ---------------------------------------------------------
 * Pre-execution integrity pipeline for all workflows.
 *
 * Responsibilities:
 * - validate workflow consistency BEFORE execution
 * - detect anomalies early
 * - block unsafe execution paths
 * - provide structured validation outcome for upstream pipelines
 *
 * This is a GATEKEEPER PIPELINE used before:
 * - recovery
 * - business execution
 * - payment flows
 */

export interface WorkflowValidationPipelineInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  metadata?: Record<string, any>;
}

export interface WorkflowValidationPipelineOutput {
  valid: boolean;

  safeToProceed: boolean;

  anomalyDetected: boolean;

  anomalyType?: string;

  blocked: boolean;

  checkedAt: Date;
}

@Injectable()
export class WorkflowValidationPipeline {
  constructor(
    private readonly validator: ValidateWorkflowConsistencyUseCase,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 PIPELINE EXECUTION
  // ==================================================

  async execute(
    input: WorkflowValidationPipelineInput,
  ): Promise<WorkflowValidationPipelineOutput> {
    // ==================================================
    // 🔍 RUN CONSISTENCY VALIDATION
    // ==================================================

    const result = await this.validator.execute({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      workflowId: input.workflowId,
      currentState: input.currentState,
      metadata: input.metadata,
    });

    const blocked = !result.safeToProceed;

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_VALIDATION_PIPELINE_EXECUTED',
      state: input.currentState,
      metadata: {
        workflowId: input.workflowId,
        valid: result.valid,
        anomalyDetected: result.anomalyDetected,
        anomalyType: result.anomalyType,
        blocked,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    if (blocked) {
      this.logger.warn(
        'WorkflowValidationPipeline',
        'WORKFLOW_BLOCKED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            workflowId: input.workflowId,
            anomalyType: result.anomalyType,
          },
        },
      );
    } else {
      this.logger.log(
        'WorkflowValidationPipeline',
        'WORKFLOW_VALIDATED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            workflowId: input.workflowId,
          },
        },
      );
    }

    return {
      valid: result.valid,
      safeToProceed: result.safeToProceed,
      anomalyDetected: result.anomalyDetected,
      anomalyType: result.anomalyType,
      blocked,
      checkedAt: new Date(),
    };
  }
}
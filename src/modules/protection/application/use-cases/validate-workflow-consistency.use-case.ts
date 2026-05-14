// FILE: src/modules/protection/application/use-cases/validate-workflow-consistency.use-case.ts

import { Injectable } from '@nestjs/common';

import { WorkflowConsistencyService } from '../coordinators/workflow-consistency.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * ValidateWorkflowConsistencyUseCase
 * ---------------------------------------------------------
 * Entry point for validating workflow integrity BEFORE execution.
 *
 * Responsibilities:
 * - detect inconsistent workflow states
 * - validate cross-service integrity
 * - prevent execution on corrupted workflows
 * - ensure safe recovery path routing if needed
 *
 * IMPORTANT:
 * This is a GATEKEEPER use-case.
 * It runs BEFORE any recovery or execution logic.
 */

export interface ValidateWorkflowConsistencyInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  metadata?: Record<string, any>;
}

export interface ValidateWorkflowConsistencyOutput {
  valid: boolean;

  anomalyDetected: boolean;

  anomalyType?: string;

  safeToProceed: boolean;

  checkedAt: Date;
}

@Injectable()
export class ValidateWorkflowConsistencyUseCase {
  constructor(
    private readonly consistency: WorkflowConsistencyService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE VALIDATION
  // ==================================================

  async execute(
    input: ValidateWorkflowConsistencyInput,
  ): Promise<ValidateWorkflowConsistencyOutput> {
    // ==================================================
    // 🔍 CONSISTENCY CHECK
    // ==================================================

    const result = await this.consistency.validate({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      workflowId: input.workflowId,
      currentState: input.currentState,
      metadata: input.metadata,
    });

    const safeToProceed = result.valid && !result.anomalyDetected;

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_CONSISTENCY_VALIDATED',
      state: input.currentState,
      metadata: {
        workflowId: input.workflowId,
        valid: result.valid,
        anomalyDetected: result.anomalyDetected,
        anomalyType: result.anomalyType,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log('info', 'ValidateWorkflowConsistencyUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          valid: result.valid,
          anomalyDetected: result.anomalyDetected,
        },
      },
    );

    return {
      valid: result.valid,
      anomalyDetected: result.anomalyDetected,
      anomalyType: result.anomalyType,
      safeToProceed,
      checkedAt: new Date(),
    };
  }
}
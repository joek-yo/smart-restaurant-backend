// FILE: src/modules/protection/application/pipelines/workflow-repair.pipeline.ts

import { Injectable } from '@nestjs/common';

import { RepairStuckWorkflowUseCase } from '../use-cases/repair-stuck-workflow.use-case';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * WorkflowRepairPipeline
 * ---------------------------------------------------------
 * End-to-end pipeline for automated workflow repair execution.
 *
 * Responsibilities:
 * - detect corrupted or stuck workflows
 * - execute repair use-case
 * - ensure audit trail consistency
 * - provide standardized repair outcome
 *
 * This pipeline is triggered AFTER:
 * - validation failure
 * - anomaly detection
 * - stuck workflow detection
 */

export interface WorkflowRepairPipelineInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  anomalyType?: string;

  severity?: 'low' | 'medium' | 'high' | 'critical';

  metadata?: Record<string, any>;
}

export interface WorkflowRepairPipelineOutput {
  success: boolean;

  repaired: boolean;

  restoredState: string;

  workflowType: string;

  handledAt: Date;

  usedStrategy: 'repair' | 'coordinator' | 'failed';
}

@Injectable()
export class WorkflowRepairPipeline {
  constructor(
    private readonly repairUseCase: RepairStuckWorkflowUseCase,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 PIPELINE ENTRY POINT
  // ==================================================

  async execute(
    input: WorkflowRepairPipelineInput,
  ): Promise<WorkflowRepairPipelineOutput> {
    // ==================================================
    // 🛠️ EXECUTE REPAIR USE CASE
    // ==================================================

    const result = await this.repairUseCase.execute({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      workflowId: input.workflowId,
      currentState: input.currentState,
      anomalyType: input.anomalyType,
      severity: input.severity,
    });

    const usedStrategy = result.usedStrategy;

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_REPAIR_PIPELINE_EXECUTED',
      state: result.restoredState,
      metadata: {
        workflowId: input.workflowId,
        anomalyType: input.anomalyType,
        severity: input.severity,
        usedStrategy,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    if (result.repaired) {
      this.logger.warn(
        'WorkflowRepairPipeline',
        'WORKFLOW_REPAIRED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            workflowId: input.workflowId,
            restoredState: result.restoredState,
            severity: input.severity,
          },
        },
      );
    } else {
      this.logger.log(
        'WorkflowRepairPipeline',
        'WORKFLOW_REPAIR_FAILED',
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
      success: result.success,
      repaired: result.repaired,
      restoredState: result.restoredState,
      workflowType: input.workflowType,
      handledAt: result.repairedAt,
      usedStrategy,
    };
  }
}
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
// FILE: src/modules/protection/application/use-cases/repair-stuck-workflow.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';

import { WorkflowRepairService } from '../services/workflow-repair.service';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RepairStuckWorkflowUseCase
 * ---------------------------------------------------------
 * Entry point for repairing frozen, stuck, or corrupted workflows.
 *
 * Responsibilities:
 * - detect repairable workflow corruption
 * - trigger safe repair operations
 * - escalate severe corruption to coordinator
 * - restore workflow to stable state
 *
 * IMPORTANT:
 * This is DIFFERENT from recovery:
 * - Recovery = resume valid state
 * - Repair = fix broken/corrupted state
 */

export interface RepairStuckWorkflowInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  anomalyType?: string;

  severity?: 'low' | 'medium' | 'high' | 'critical';

  metadata?: Record<string, any>;
}

export interface RepairStuckWorkflowOutput {
  success: boolean;

  repaired: boolean;

  restoredState: string;

  repairedAt: Date;

  workflowStatus: WorkflowStatus;

  usedStrategy: 'repair' | 'coordinator';
}

@Injectable()
export class RepairStuckWorkflowUseCase {
  constructor(
    private readonly repairService: WorkflowRepairService,
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE WORKFLOW REPAIR
  // ==================================================

  async execute(
    input: RepairStuckWorkflowInput,
  ): Promise<RepairStuckWorkflowOutput> {
    const strategy = this.selectStrategy(input);

    // ==================================================
    // 🧭 COORDINATOR PATH (CRITICAL CORRUPTION)
    // ==================================================

    if (strategy === 'coordinator') {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          currentState: input.currentState,
          recoveryReason: RecoveryReason.ABANDONED,
          reason: RecoveryReason.ABANDONED,
          workflowId: input.workflowId,
        });

      return {
        success: result.success,
        repaired: true,
        restoredState: result.finalState,
        repairedAt: result.executedAt,
        workflowStatus: WorkflowStatus.RECOVERED,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // 🛠️ DIRECT REPAIR PATH
    // ==================================================

    const result =
      await this.repairService.repair({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        workflowId: input.workflowId,
        currentState: input.currentState,
        anomalyType: (input.anomalyType as WorkflowAnomalyType) ?? WorkflowAnomalyType.UNKNOWN,
      });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_REPAIRED',
      state: result.repairedState,
      metadata: {
        workflowId: input.workflowId,
        anomalyType: (input.anomalyType as WorkflowAnomalyType) ?? WorkflowAnomalyType.UNKNOWN,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.warn('RepairStuckWorkflowUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          restoredState: result.repairedState,
          },
      },
    );

    return {
      success: result.repaired,
      repaired: result.repaired,
      restoredState: result.repairedState,
      repairedAt: result.repairedAt,
      workflowStatus: WorkflowStatus.RECOVERED,
      usedStrategy: 'repair',
    };
  }

  // ==================================================
  // 🧠 STRATEGY SELECTION
  // ==================================================

  private selectStrategy(
    input: RepairStuckWorkflowInput,
  ): 'repair' | 'coordinator' {
    // critical corruption always escalates
    if (input.severity === 'critical') return 'coordinator';

    if (input.anomalyType === 'TENANT_BREACH') return 'coordinator';

    if (input.workflowType === 'payment' && input.severity === 'high')
      return 'coordinator';

    return 'repair';
  }
}
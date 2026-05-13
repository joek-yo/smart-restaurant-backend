// FILE: src/modules/protection/interfaces/http/protection.controller.ts

import { Body, Controller, Post } from '@nestjs/common';

import { RecoveryPipeline } from '../../application/pipelines/recovery.pipeline';
import { WorkflowRepairPipeline } from '../../application/pipelines/workflow-repair.pipeline';

import { RecoverSessionDto } from '../dto/recover-session.dto';
import { RepairWorkflowDto } from '../dto/repair-workflow.dto';

/**
 * ProtectionController
 * ---------------------------------------------------------
 * API entry point for workflow protection operations.
 *
 * Responsibilities:
 * - expose recovery endpoints
 * - expose repair endpoints
 * - route requests into internal pipelines
 * - ensure clean separation between HTTP layer and domain logic
 *
 * This controller does NOT contain business logic.
 * It only delegates to pipelines.
 */

@Controller('protection')
export class ProtectionController {
  constructor(
    private readonly recoveryPipeline: RecoveryPipeline,
    private readonly repairPipeline: WorkflowRepairPipeline,
  ) {}

  // ==================================================
  // 🔁 SESSION RECOVERY
  // ==================================================

  @Post('recover/session')
  async recoverSession(@Body() dto: RecoverSessionDto) {
    return this.recoveryPipeline.execute({
      tenantId: dto.tenantId,
      userId: dto.userId,
      workflowType: 'session',
      workflowId: dto.sessionId,
      currentState: dto.currentState,
      recoveryReason: dto.reason as any,
      metadata: dto.metadata,
    });
  }

  // ==================================================
  // 🛠️ WORKFLOW REPAIR
  // ==================================================

  @Post('repair/workflow')
  async repairWorkflow(@Body() dto: RepairWorkflowDto) {
    return this.repairPipeline.execute({
      tenantId: dto.tenantId,
      userId: dto.userId,
      workflowType: dto.workflowType ?? 'conversation',
      workflowId: dto.workflowId,
      currentState: dto.currentState,
      anomalyType: dto.anomalyType,
      severity: dto.severity,
      metadata: dto.metadata,
    });
  }
}
// FILE: src/modules/protection/infrastructure/queues/workflow-repair.worker.ts

import { Injectable } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { WorkflowRepairPipeline } from '../../application/pipelines/workflow-repair.pipeline';
import { WorkflowRepairPipelineInput } from '../../application/pipelines/workflow-repair.pipeline';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { WorkflowTimelineService } from '../../application/services/workflow-timeline.service';

/**
 * WorkflowRepairWorker
 * ---------------------------------------------------------
 * Background worker responsible for executing workflow repair jobs.
 *
 * Responsibilities:
 * - consume repair queue jobs
 * - execute repair pipeline asynchronously
 * - restore corrupted or stuck workflows
 * - ensure traceable repair execution lifecycle
 *
 * This is the EXECUTION LAYER for:
 * RepairQueue → WorkflowRepairPipeline → Repair UseCase
 */

@Injectable()
@Processor('repair-queue')
export class WorkflowRepairWorker {
  constructor(
    private readonly repairPipeline: WorkflowRepairPipeline,
    private readonly logger: ProtectionLoggerService,
    private readonly timeline: WorkflowTimelineService,
  ) {}

  // ==================================================
  // 🚀 PROCESS REPAIR JOB
  // ==================================================

  @Process('execute-repair')
  async handleRepairJob(
    job: Job<WorkflowRepairPipelineInput>,
  ): Promise<any> {
    const input = job.data;

    this.logger.log('WorkflowRepairWorker', 'JOB_STARTED', {
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: {
        workflowType: input.workflowType,
        workflowId: input.workflowId,
        jobId: job.id,
      },
    });

    try {
      // ==================================================
      // 🛠️ EXECUTE REPAIR PIPELINE
      // ==================================================

      const result = await this.repairPipeline.execute(input);

      // ==================================================
      // 📝 SUCCESS TIMELINE EVENT
      // ==================================================

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'WORKFLOW_REPAIR_JOB_COMPLETED',
        state: result.restoredState,
        metadata: {
          jobId: job.id,
          usedStrategy: result.usedStrategy,
          workflowId: input.workflowId,
        },
      });

      this.logger.log('WorkflowRepairWorker', 'JOB_SUCCESS', {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          jobId: job.id,
          restoredState: result.restoredState,
          usedStrategy: result.usedStrategy,
        },
      });

      return result;
    } catch (error: any) {
      // ==================================================
      // ❌ FAILURE HANDLING
      // ==================================================

      this.logger.warn('WorkflowRepairWorker', 'JOB_FAILED', {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          jobId: job.id,
          error: error?.message,
          workflowType: input.workflowType,
          workflowId: input.workflowId,
        },
      });

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'WORKFLOW_REPAIR_JOB_FAILED',
        state: input.currentState,
        metadata: {
          jobId: job.id,
          error: error?.message,
        },
      });

      throw error;
    }
  }
}
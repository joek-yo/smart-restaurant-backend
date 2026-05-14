// FILE: src/modules/protection/infrastructure/queues/recovery.worker.ts

import { Injectable } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { RecoveryPipeline } from '../../application/pipelines/recovery.pipeline';
import { RecoveryPipelineInput } from '../../application/pipelines/recovery.pipeline';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { WorkflowTimelineService } from '../../application/services/workflow-timeline.service';

/**
 * RecoveryWorker
 * ---------------------------------------------------------
 * Background worker for executing recovery pipeline jobs.
 *
 * Responsibilities:
 * - consume recovery queue jobs
 * - execute full recovery pipeline asynchronously
 * - ensure resilience against transient failures
 * - log + trace execution lifecycle
 *
 * This is the EXECUTION LAYER for:
 * RecoveryQueue → RecoveryPipeline → Use Cases
 */

@Injectable()
@Processor('recovery-queue')
export class RecoveryWorker {
  constructor(
    private readonly recoveryPipeline: RecoveryPipeline,
    private readonly logger: ProtectionLoggerService,
    private readonly timeline: WorkflowTimelineService,
  ) {}

  // ==================================================
  // 🚀 PROCESS RECOVERY JOB
  // ==================================================

  @Process('execute-recovery')
  async handleRecoveryJob(
    job: Job<RecoveryPipelineInput>,
  ): Promise<any> {
    const input = job.data;

    this.logger.log('info', 'RecoveryWorker', 'JOB_STARTED', {
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
      // 🧠 EXECUTE FULL RECOVERY PIPELINE
      // ==================================================

      const result = await this.recoveryPipeline.execute(input);

      // ==================================================
      // 📝 SUCCESS TIMELINE EVENT
      // ==================================================

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'RECOVERY_JOB_COMPLETED',
        state: result.restoredState,
        metadata: {
          jobId: job.id,
          handledBy: result.handledBy,
        },
      });

      this.logger.log('info', 'RecoveryWorker', 'JOB_SUCCESS', {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          jobId: job.id,
          handledBy: result.handledBy,
          restoredState: result.restoredState,
        },
      });

      return result;
    } catch (error: any) {
      // ==================================================
      // ❌ FAILURE HANDLING
      // ==================================================

      this.logger.warn('RecoveryWorker', 'JOB_FAILED', {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          jobId: job.id,
          error: error?.message,
          workflowType: input.workflowType,
        },
      });

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'RECOVERY_JOB_FAILED',
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
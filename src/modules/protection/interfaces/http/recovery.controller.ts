// FILE: src/modules/protection/interfaces/http/recovery.controller.ts

import { Body, Controller, Post } from '@nestjs/common';

import { RecoveryPipeline } from '../../application/pipelines/recovery.pipeline';
import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

/**
 * RecoveryController
 * ---------------------------------------------------------
 * API entry point for executing full recovery operations.
 *
 * Responsibilities:
 * - expose unified recovery endpoint for all workflow types
 * - delegate execution to RecoveryPipeline
 * - ensure HTTP layer remains thin and stateless
 *
 * This controller is the MAIN ENTRY POINT for:
 * - automated recovery triggers (webhooks, schedulers)
 * - manual admin recovery actions
 */

export interface RecoveryRequestDto {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  metadata?: Record<string, any>;
}

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryPipeline: RecoveryPipeline) {}

  // ==================================================
  // 🚀 EXECUTE RECOVERY
  // ==================================================

  @Post('execute')
  async executeRecovery(@Body() dto: RecoveryRequestDto) {
    return this.recoveryPipeline.execute({
      tenantId: dto.tenantId,
      userId: dto.userId,
      workflowType: dto.workflowType,
      workflowId: dto.workflowId,
      currentState: dto.currentState,
      recoveryReason: dto.recoveryReason,
      metadata: dto.metadata,
    });
  }
}
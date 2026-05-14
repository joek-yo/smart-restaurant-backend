// FILE: src/modules/follow-up-engine/presentation/follow-up.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';

import { FollowUpRepository } from '../domain/repositories/follow-up.repository';
import { FollowUpCancelService } from '../application/services/follow-up-cancel.service';
import { FollowUpRescheduleService } from '../application/services/follow-up-reschedule.service';

/**
 * FOLLOW-UP CONTROLLER (ADMIN / DEBUG LAYER)
 * -----------------------------------------------------
 * Provides operational visibility and control over
 * the follow-up engine.
 *
 * IMPORTANT:
 * - NO business logic
 * - NO scheduling logic
 * - PURE OPERATIONS INTERFACE
 */

@Controller('follow-ups')
export class FollowUpController {
  private readonly logger = new Logger(FollowUpController.name);

  constructor(
    private readonly repository: FollowUpRepository,
    private readonly cancelService: FollowUpCancelService,
    private readonly rescheduleService: FollowUpRescheduleService,
  ) {}

  // ==================================================
  // 📦 LIST FOLLOW-UPS
  // ==================================================
  @Get()
  async listFollowUps(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(
      `[ADMIN] list follow-ups tenant=${tenantId} user=${userId}`,
    );

    if (userId) {
      return this.repository.findByUser(tenantId, userId);
    }

    if (status === 'pending') {
      return this.repository.findPending();
    }

    return this.repository.findPending(); // fallback view
  }

  // ==================================================
  // ❌ CANCEL FOLLOW-UP
  // ==================================================
  @Post(':id/cancel')
  async cancelFollowUp(@Param('id') id: string) {
    this.logger.warn(`[ADMIN] cancel follow-up id=${id}`);

    await this.cancelService.cancel({
      tenantId: 'ADMIN',
      userId: id,
      reason: 'MANUAL_CANCELLATION',
    });

    return {
      success: true,
      message: 'Follow-up cancelled',
    };
  }

  // ==================================================
  // ⏱️ RESCHEDULE FOLLOW-UP
  // ==================================================
  @Post(':id/reschedule')
  async rescheduleFollowUp(
    @Param('id') id: string,
    @Body()
    body: {
      scheduledAt: string;
    },
  ) {
    this.logger.log(
      `[ADMIN] reschedule follow-up id=${id} → ${body.scheduledAt}`,
    );

    await this.rescheduleService.reschedule({
      followUpId: id,
      scheduledAt: new Date(body.scheduledAt),
      reason: "MANUAL_RESCHEDULE",
    });

    return {
      success: true,
      message: 'Follow-up rescheduled',
    };
  }

  // ==================================================
  // 🚨 INSPECT FAILED JOBS
  // ==================================================
  @Get('failed')
  async failedJobs(@Query('tenantId') tenantId: string) {
    this.logger.error(`[ADMIN] inspect failed jobs tenant=${tenantId}`);

    return this.repository.findByUser(tenantId, "");
  }
}
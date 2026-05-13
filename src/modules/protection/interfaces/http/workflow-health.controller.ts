// FILE: src/modules/protection/interfaces/http/workflow-health.controller.ts

import { Body, Controller, Post, Get } from '@nestjs/common';

import { WorkflowHealthMonitorService } from '../../infrastructure/observability/workflow-health-monitor.service';
import { AnomalyDetectorService } from '../../infrastructure/observability/anomaly-detector.service';

import { WorkflowHealthDto } from '../dto/workflow-health.dto';

/**
 * WorkflowHealthController
 * ---------------------------------------------------------
 * API entry point for workflow monitoring & health inspection.
 *
 * Responsibilities:
 * - expose workflow health queries
 * - trigger health analysis snapshots
 * - expose anomaly detection results
 * - provide observability interface for admins/dashboards
 *
 * This is READ + DIAGNOSTIC ONLY.
 * No mutations or recovery logic is executed here.
 */

@Controller('workflow-health')
export class WorkflowHealthController {
  constructor(
    private readonly healthMonitor: WorkflowHealthMonitorService,
    private readonly anomalyDetector: AnomalyDetectorService,
  ) {}

  // ==================================================
  // 📊 GET CURRENT HEALTH SNAPSHOT
  // ==================================================

  @Get('snapshot')
  async getSnapshot() {
    return this.healthMonitor.collect();
  }

  // ==================================================
  // 🔍 RUN ANOMALY DETECTION ON DEMAND
  // ==================================================

  @Post('anomalies')
  async detectAnomalies(@Body() dto: WorkflowHealthDto) {
    const healthData = await this.healthMonitor.collect();

    return this.anomalyDetector.detect({
      ...healthData,
      scope: dto.scope,
      tenantId: dto.tenantId,
      userId: dto.userId,
      workflowId: dto.workflowId,
      workflowType: dto.workflowType,
    } as any);
  }
}
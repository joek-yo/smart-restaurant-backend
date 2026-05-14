// FILE: src/modules/protection/application/services/workflow-timeline.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WorkflowTimelineRepository } from '../../domain/repositories/workflow-timeline.repository';
import { WorkflowTraceIdVO } from '../../domain/value-objects/workflow-trace-id.vo';
import { TenantScopeVO } from '../../domain/value-objects/tenant-scope.vo';

/**
 * WorkflowTimelineService
 * -----------------------
 * Canonical event recording system for ALL workflows.
 *
 * PURPOSE:
 * - Record every meaningful workflow transition
 * - Provide forensic traceability (debugging + recovery)
 * - Enable anomaly detection & replay
 *
 * THINK OF THIS AS:
 * → "Black box recorder" for your entire system
 *
 * RULE:
 * This service NEVER changes state.
 * It ONLY records events.
 */
@Injectable()
export class WorkflowTimelineService {
  private readonly logger = new Logger(WorkflowTimelineService.name);

  constructor(
    private readonly timelineRepo: WorkflowTimelineRepository,
  ) {}

  /**
   * Record a workflow event
   */
  async record(input: {
    tenantId: string;
    workflowId: string;
    traceId?: string;
    type: string;
    source: 'CONVERSATION' | 'CHECKOUT' | 'PAYMENT' | 'ORDER' | 'SESSION';
    payload?: Record<string, any>;
  }): Promise<void> {
    const scope = new TenantScopeVO(input.tenantId);

    const traceId = new WorkflowTraceIdVO(
      input.traceId ?? `${input.tenantId}:${input.workflowId}:${Date.now()}`,
    );

    this.logger.debug(
      `[TIMELINE] ${input.type} workflow=${input.workflowId} tenant=${input.tenantId}`,
    );

    await this.timelineRepo.save(new (require('../../domain/entities/workflow-timeline.entity').WorkflowTimelineEntity)({
      tenantId: input.tenantId,
      workflowId: input.workflowId,
      eventType: input.type ?? 'STATE_TRANSITION',
      traceId: traceId.getValue(),
      payload: { source: input.source, ...(input.payload ?? {}) },
    }));
  }

  /**
   * Fetch workflow history (used by recovery engine)
   */
  async getHistory(input: {
    tenantId: string;
    workflowId: string;
  }) {
    const scope = new TenantScopeVO(input.tenantId);
    return this.timelineRepo.findByTraceId(input.workflowId);
  }

  /**
   * Fetch recent events across tenant (for monitoring)
   */
  async getRecent(input: {
    tenantId: string;
    limit?: number;
  }) {
    const scope = new TenantScopeVO(input.tenantId);
    return this.timelineRepo.findRecentByTenant(input.tenantId, input.limit ?? 50);
  }

  async recordEvent(event: any): Promise<void> {
    try {
      const scope = new TenantScopeVO(event.tenantId ?? 'unknown');
      await this.timelineRepo.save(new (require('../../domain/entities/workflow-timeline.entity').WorkflowTimelineEntity)({
        tenantId: event.tenantId ?? 'unknown',
        workflowId: event.userId ?? 'unknown',
        eventType: 'STATE_TRANSITION',
        payload: { ...event },
      }));
    } catch {}
  }

  async getTimeline(tenantId: string, userId: string): Promise<{ events: Array<{ timestamp: number }> } | null> {
    return null;
  }
}

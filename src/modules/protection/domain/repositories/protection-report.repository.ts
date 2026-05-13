// src/modules/protection/domain/repositories/protection-report.repository.ts

import { ProtectionReportEntity } from '../entities/protection-report.entity';
import { ProtectionLevel } from '../enums/protection-level.enum';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowAnomalyType } from '../enums/workflow-anomaly-type.enum';

export interface ProtectionReportFilter {
  tenantId?: string;
  userId?: string;
  level?: ProtectionLevel;
  anomalyType?: WorkflowAnomalyType;
  traceId?: WorkflowTraceId;
  from?: Date;
  to?: Date;
}

export abstract class ProtectionReportRepository {

  // ─────────────────────────────────────────────
  // CREATE / SAVE
  // ─────────────────────────────────────────────

  abstract create(report: ProtectionReportEntity): Promise<ProtectionReportEntity>;

  abstract save(report: ProtectionReportEntity): Promise<ProtectionReportEntity>;

  // ─────────────────────────────────────────────
  // FETCH SINGLE
  // ─────────────────────────────────────────────

  abstract findById(id: string): Promise<ProtectionReportEntity | null>;

  abstract findByTraceId(
    traceId: WorkflowTraceId,
  ): Promise<ProtectionReportEntity | null>;

  // ─────────────────────────────────────────────
  // QUERY / ANALYTICS
  // ─────────────────────────────────────────────

  abstract findByTenant(
    scope: TenantScope,
  ): Promise<ProtectionReportEntity[]>;

  abstract findByFilter(
    filter: ProtectionReportFilter,
  ): Promise<ProtectionReportEntity[]>;

  abstract findRecent(limit: number): Promise<ProtectionReportEntity[]>;

  abstract findCritical(limit?: number): Promise<ProtectionReportEntity[]>;

  // ─────────────────────────────────────────────
  // AGGREGATION / HEALTH
  // ─────────────────────────────────────────────

  abstract countByLevel(
    tenantId: string,
    level: ProtectionLevel,
  ): Promise<number>;

  abstract countAnomalies(
    tenantId: string,
    anomalyType: WorkflowAnomalyType,
  ): Promise<number>;

  abstract getSystemHealthScore(
    tenantId: string,
  ): Promise<number>; // 0–100 health index

  // ─────────────────────────────────────────────
  // LIFECYCLE OPS
  // ─────────────────────────────────────────────

  abstract delete(id: string): Promise<void>;

  abstract purgeOlderThan(date: Date): Promise<number>;
}
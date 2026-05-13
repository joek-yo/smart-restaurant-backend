// src/modules/protection/domain/repositories/recovery-session.repository.ts

import { RecoverySessionEntity } from '../entities/recovery-session.entity';
import { RecoveryState } from '../enums/recovery-state.enum';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';

export abstract class RecoverySessionRepository {

  // ─────────────────────────────────────────────
  // CREATE / SAVE
  // ─────────────────────────────────────────────

  abstract create(session: RecoverySessionEntity): Promise<RecoverySessionEntity>;

  abstract save(session: RecoverySessionEntity): Promise<RecoverySessionEntity>;

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────

  abstract findById(id: string): Promise<RecoverySessionEntity | null>;

  abstract findByTraceId(traceId: WorkflowTraceId): Promise<RecoverySessionEntity[]>;

  abstract findByTenant(scope: TenantScope): Promise<RecoverySessionEntity[]>;

  abstract findActiveByUser(
    tenantId: string,
    userId: string,
  ): Promise<RecoverySessionEntity | null>;

  // ─────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────

  abstract updateState(
    id: string,
    state: RecoveryState,
  ): Promise<RecoverySessionEntity>;

  abstract markStarted(id: string): Promise<void>;

  abstract markCompleted(id: string): Promise<void>;

  abstract markFailed(
    id: string,
    reason: RecoveryReason,
  ): Promise<void>;

  // ─────────────────────────────────────────────
  // LIFECYCLE OPS
  // ─────────────────────────────────────────────

  abstract delete(id: string): Promise<void>;

  abstract expireOldSessions(beforeDate: Date): Promise<number>;
}
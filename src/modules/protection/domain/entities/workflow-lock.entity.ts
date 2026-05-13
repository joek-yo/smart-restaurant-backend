// src/modules/protection/domain/entities/workflow-lock.entity.ts

import { WorkflowLockIdVO } from '../value-objects/workflow-lock-id.vo';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';

/**
 * WorkflowLockEntity
 * -------------------
 * Represents distributed lock ownership for a workflow.
 *
 * RULES:
 * - Only ONE active owner per lockId at any time
 * - Must always be tenant-scoped
 * - Must be traceable for debugging/recovery
 */
export class WorkflowLockEntity {
  constructor(
    public readonly lockId: WorkflowLockIdVO,
    public readonly tenantScope: TenantScopeVO,
    public readonly traceId: WorkflowTraceIdVO,

    public readonly ownerId: string, // worker/service instance id

    public readonly acquiredAt: Date = new Date(),
    public expiresAt: Date,

    public readonly metadata: Record<string, any> = {},
  ) {}

  // ─────────────────────────────────────────────
  // 🔐 LOCK STATE
  // ─────────────────────────────────────────────

  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  isOwnedBy(ownerId: string): boolean {
    return this.ownerId === ownerId;
  }

  isActive(): boolean {
    return !this.isExpired();
  }

  // ─────────────────────────────────────────────
  // 🔄 EXTENSION (RENEW LOCK)
  // ─────────────────────────────────────────────

  renew(extensionMs: number): WorkflowLockEntity {
    return new WorkflowLockEntity(
      this.lockId,
      this.tenantScope,
      this.traceId,
      this.ownerId,
      this.acquiredAt,
      new Date(Date.now() + extensionMs),
      this.metadata,
    );
  }

  // ─────────────────────────────────────────────
  // 🧠 FACTORY
  // ─────────────────────────────────────────────

  static create(params: {
    lockId: WorkflowLockIdVO;
    tenantScope: TenantScopeVO;
    traceId: WorkflowTraceIdVO;
    ownerId: string;
    ttlMs: number;
    metadata?: Record<string, any>;
  }): WorkflowLockEntity {
    return new WorkflowLockEntity(
      params.lockId,
      params.tenantScope,
      params.traceId,
      params.ownerId,
      new Date(),
      new Date(Date.now() + params.ttlMs),
      params.metadata ?? {},
    );
  }

  // ─────────────────────────────────────────────
  // 🔒 SAFETY CHECKS
  // ─────────────────────────────────────────────

  assertOwnership(ownerId: string): void {
    if (this.ownerId !== ownerId) {
      throw new Error(
        `LOCK_OWNERSHIP_VIOLATION: expected=${this.ownerId} got=${ownerId}`,
      );
    }
  }

  assertValid(): void {
    if (this.isExpired()) {
      throw new Error(`LOCK_EXPIRED: ${this.lockId.getValue()}`);
    }
  }
}
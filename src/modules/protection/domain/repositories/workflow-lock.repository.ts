// src/modules/protection/domain/repositories/workflow-lock.repository.ts

import { WorkflowLockEntity } from '../entities/workflow-lock.entity';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';

/**
 * WorkflowLockRepository
 * ----------------------
 * Abstract contract for distributed workflow locking.
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * - concurrency control
 * - workflow execution safety
 * - preventing double-processing (checkout/payment/order)
 *
 * IMPLEMENTATIONS may use:
 * - Redis (preferred)
 * - database locks
 * - in-memory (dev only)
 *
 * BUT ALL MUST RESPECT THIS CONTRACT.
 */
export abstract class WorkflowLockRepository {

  /**
   * Acquire a lock for a workflow.
   *
   * MUST be atomic (no race conditions).
   * MUST fail if lock already exists (or be safely overridden with TTL rules).
   */
  abstract acquire(
    workflowId: string,
    tenantScope: TenantScope,
    traceId: WorkflowTraceId,
    ttlSeconds?: number,
  ): Promise<WorkflowLockEntity | null>;

  /**
   * Release a lock explicitly.
   */
  abstract release(
    workflowId: string,
    tenantScope: TenantScope,
  ): Promise<void>;

  /**
   * Extend lock lifetime (heartbeat / keep-alive).
   */
  abstract renew(
    workflowId: string,
    tenantScope: TenantScope,
    ttlSeconds: number,
  ): Promise<boolean>;

  /**
   * Check if workflow is currently locked.
   */
  abstract isLocked(
    workflowId: string,
    tenantScope: TenantScope,
  ): Promise<boolean>;

  /**
   * Get current lock owner (if any).
   */
  abstract getLock(
    workflowId: string,
    tenantScope: TenantScope,
  ): Promise<WorkflowLockEntity | null>;

  /**
   * Force release (emergency / recovery override).
   * ⚠️ Use carefully — used only in recovery engine.
   */
  abstract forceRelease(
    workflowId: string,
    tenantScope: TenantScope,
    reason: string,
  ): Promise<void>;
}
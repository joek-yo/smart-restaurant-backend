// FILE: src/modules/protection/application/coordinators/distributed-lock-coordinator.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { WorkflowLockIdVO } from '../../domain/value-objects/workflow-lock-id.vo';
import { RedisLockService } from '../../infrastructure/locks/redis-lock.service';

/**
 * DistributedLockCoordinatorService
 * ----------------------------------
 * Central authority for ALL distributed locking decisions.
 *
 * Responsibilities:
 * - Create lock keys consistently across workflows
 * - Acquire/release locks via RedisLockService
 * - Prevent cross-workflow race conditions
 * - Enforce tenant isolation at lock level
 *
 * This is NOT a lock implementation.
 * It is the orchestration layer above all locks.
 */
@Injectable()
export class DistributedLockCoordinatorService {
  private readonly logger = new Logger(DistributedLockCoordinatorService.name);

  constructor(
    private readonly redisLock: RedisLockService,
  ) {}

  // ==================================================
  // 🔒 ACQUIRE LOCK (GENERIC WORKFLOW ENTRY)
  // ==================================================
  async acquireLock(input: {
    tenantId: string;
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
    resourceId: string;
    ownerId: string;
    ttlMs?: number;
  }): Promise<boolean> {
    const lockId = new WorkflowLockIdVO(`${input.tenantId}:${input.workflowType}:${input.resourceId}`);

    const key = lockId.getValue();

    this.logger.debug(
      `[LOCK] acquiring key=${key} owner=${input.ownerId}`,
    );

    const result = await this.redisLock.acquire(key, Math.ceil((input.ttlMs ?? 10_000) / 1000));

    if (!result.acquired) {
      this.logger.warn(
        `[LOCK] failed key=${key} owner=${input.ownerId}`,
      );
    }

    return result.acquired;
  }

  // ==================================================
  // 🔓 RELEASE LOCK
  // ==================================================
  async releaseLock(input: {
    tenantId: string;
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
    resourceId: string;
    ownerId: string;
  }): Promise<boolean> {
    const key = new WorkflowLockIdVO(`${input.tenantId}:${input.workflowType}:${input.resourceId}`).getValue();

    this.logger.debug(
      `[LOCK] releasing key=${key} owner=${input.ownerId}`,
    );

    await this.redisLock.release(key, input.ownerId);
    return true;
  }

  // ==================================================
  // 🔁 EXTEND LOCK (HEARTBEAT)
  // ==================================================
  async extendLock(input: {
    tenantId: string;
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
    resourceId: string;
    ownerId: string;
    ttlMs?: number;
  }): Promise<boolean> {
    const key = new WorkflowLockIdVO(`${input.tenantId}:${input.workflowType}:${input.resourceId}`).getValue();

    this.logger.debug(
      `[LOCK] extending key=${key} owner=${input.ownerId}`,
    );

    return this.redisLock.extend(key, input.ownerId, Math.ceil((input.ttlMs ?? 10_000) / 1000));
  }

  // ==================================================
  // 🧠 CHECK LOCK STATUS
  // ==================================================
  async isLocked(input: {
    tenantId: string;
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
    resourceId: string;
  }): Promise<boolean> {
    const key = new WorkflowLockIdVO(`${input.tenantId}:${input.workflowType}:${input.resourceId}`).getValue();

    return this.redisLock.isLocked(key);
  }

  // ==================================================
  // 🚨 FORCE RELEASE (RECOVERY ENGINE ONLY)
  // ==================================================
  async forceRelease(input: {
    tenantId: string;
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
    resourceId: string;
    reason: string;
  }): Promise<void> {
    const key = new WorkflowLockIdVO(`${input.tenantId}:${input.workflowType}:${input.resourceId}`).getValue();

    this.logger.warn(
      `[LOCK] FORCE RELEASE key=${key} reason=${input.reason}`,
    );

    await this.redisLock.forceRelease(key);
  }

  // ==================================================
  // 🧠 BULK SAFETY CHECK (OPTIONAL RECOVERY USE)
  // ==================================================
  async validateNoLockConflict(input: {
    tenantId: string;
    resourceIds: string[];
    workflowType: 'checkout' | 'payment' | 'conversation' | 'order' | 'session';
  }): Promise<boolean> {
    for (const id of input.resourceIds) {
      const locked = await this.isLocked({
        tenantId: input.tenantId,
        workflowType: input.workflowType,
        resourceId: id,
      });

      if (locked) {
        this.logger.warn(
          `[LOCK] conflict detected tenant=${input.tenantId} resource=${id}`,
        );
        return false;
      }
    }

    return true;
  }

}

// FILE: src/modules/protection/infrastructure/redis/workflow-lock.redis.repository.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

import { WorkflowLockRepository } from '../../domain/repositories/workflow-lock.repository';
import { WorkflowLockEntity } from '../../domain/entities/workflow-lock.entity';
import { WorkflowLockId } from '../../domain/value-objects/workflow-lock-id.vo';
import { TenantScopeVO } from '../../domain/value-objects/tenant-scope.vo';

/**
 * WorkflowLockRedisRepository
 * ---------------------------
 * Persistence layer for distributed workflow locks.
 *
 * Stores metadata about locks, not just lock state.
 *
 * Used for:
 * - debugging stuck workflows
 * - recovery decisions
 * - observability dashboards
 * - audit trails
 */
@Injectable()
export class WorkflowLockRedisRepository implements WorkflowLockRepository {
  private readonly logger = new Logger(WorkflowLockRedisRepository.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // SAVE LOCK
  // ==================================================
  async save(lock: WorkflowLockEntity): Promise<void> {
    const key = this.buildKey(lock.lockId.getValue());

    const payload = {
      lockId: lock.lockId.getValue(),
      traceId: lock.traceId,
      tenantId: lock.tenant.tenantId,
      userId: lock.tenant.userId,
      resource: lock.resource,
      owner: lock.owner,
      createdAt: lock.createdAt,
      expiresAt: lock.expiresAt,
      status: lock.status,
    };

    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      lock.ttlSeconds ?? 60,
    );

    this.logger.debug(`[LOCK_SAVED] ${lock.lockId.getValue()}`);
  }

  // ==================================================
  // FIND LOCK BY ID
  // ==================================================
  async findById(lockId: WorkflowLockId): Promise<WorkflowLockEntity | null> {
    const raw = await this.redis.get(this.buildKey(lockId.getValue()));

    if (!raw) return null;

    try {
      const data = JSON.parse(raw);

      return new WorkflowLockEntity({
        lockId: new WorkflowLockId(data.lockId),
        traceId: data.traceId,
        tenant: new TenantScopeVO(data.tenantId, data.userId),
        resource: data.resource,
        owner: data.owner,
        status: data.status,
        createdAt: new Date(data.createdAt),
        expiresAt: new Date(data.expiresAt),
      });
    } catch (err) {
      this.logger.error(`[LOCK_PARSE_ERROR] ${lockId.getValue()}`);
      return null;
    }
  }

  // ==================================================
  // DELETE LOCK
  // ==================================================
  async delete(lockId: WorkflowLockId): Promise<void> {
    await this.redis.del(this.buildKey(lockId.getValue()));
    this.logger.debug(`[LOCK_DELETED] ${lockId.getValue()}`);
  }

  // ==================================================
  // CHECK LOCK EXISTS
  // ==================================================
  async exists(lockId: WorkflowLockId): Promise<boolean> {
    const val = await this.redis.exists(this.buildKey(lockId.getValue()));
    return val === 1;
  }

  // ==================================================
  // FIND BY TRACE (DEBUGGING / RECOVERY)
  // ==================================================
  async findByTraceId(traceId: string): Promise<WorkflowLockEntity[]> {
    const pattern = `protection:workflow-lock:*`;
    const keys = await this.redis.keys(pattern);

    const results: WorkflowLockEntity[] = [];

    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (!raw) continue;

      try {
        const data = JSON.parse(raw);

        if (data.traceId === traceId) {
          results.push(
            new WorkflowLockEntity({
              lockId: new WorkflowLockId(data.lockId),
              traceId: data.traceId,
              tenant: new TenantScopeVO(data.tenantId, data.userId),
              resource: data.resource,
              owner: data.owner,
              status: data.status,
              createdAt: new Date(data.createdAt),
              expiresAt: new Date(data.expiresAt),
            }),
          );
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  // ==================================================
  // INTERNAL KEY NAMESPACE
  // ==================================================
  private buildKey(lockId: string): string {
    return `protection:workflow-lock:${lockId}`;
  }
}
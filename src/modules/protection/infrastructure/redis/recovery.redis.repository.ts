// FILE: src/modules/protection/infrastructure/redis/recovery.redis.repository.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { RecoveryState } from '../../../domain/enums/recovery-state.enum';

/**
 * RecoveryRedisRepository
 * -----------------------
 * Stores and manages recovery execution state.
 *
 * This is NOT workflow data.
 * This is recovery PROCESS state.
 *
 * Used for:
 * - preventing duplicate recovery runs
 * - resuming failed recovery flows
 * - tracking recovery lifecycle
 */
@Injectable()
export class RecoveryRedisRepository {
  private readonly logger = new Logger(RecoveryRedisRepository.name);

  private readonly TTL_SECONDS = 60 * 60 * 6; // 6 hours

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // GET RECOVERY STATE
  // ==================================================
  async get(recoveryKey: string): Promise<any | null> {
    const raw = await this.redis.get(this.buildKey(recoveryKey));

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`[RECOVERY_PARSE_ERROR] key=${recoveryKey}`);
      return null;
    }
  }

  // ==================================================
  // START RECOVERY EXECUTION
  // ==================================================
  async start(input: {
    recoveryKey: string;
    traceId: string;
    tenantId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    const key = this.buildKey(input.recoveryKey);

    const payload = {
      traceId: input.traceId,
      tenantId: input.tenantId,
      userId: input.userId,
      reason: input.reason,
      state: RecoveryState.RUNNING,
      startedAt: new Date(),
      attempts: 1,
    };

    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      this.TTL_SECONDS,
    );

    this.logger.debug(`[RECOVERY_STARTED] key=${input.recoveryKey}`);
  }

  // ==================================================
  // UPDATE RECOVERY STATE
  // ==================================================
  async updateState(
    recoveryKey: string,
    state: RecoveryState,
    extra?: Record<string, any>,
  ): Promise<void> {
    const key = this.buildKey(recoveryKey);

    const existingRaw = await this.redis.get(key);

    if (!existingRaw) return;

    try {
      const existing = JSON.parse(existingRaw);

      const updated = {
        ...existing,
        ...extra,
        state,
        updatedAt: new Date(),
      };

      await this.redis.set(
        key,
        JSON.stringify(updated),
        'EX',
        this.TTL_SECONDS,
      );

      this.logger.debug(
        `[RECOVERY_STATE_UPDATED] key=${recoveryKey} state=${state}`,
      );
    } catch (err) {
      this.logger.error(`[RECOVERY_UPDATE_ERROR] key=${recoveryKey}`);
    }
  }

  // ==================================================
  // MARK SUCCESS
  // ==================================================
  async markCompleted(
    recoveryKey: string,
    result?: Record<string, any>,
  ): Promise<void> {
    await this.updateState(recoveryKey, RecoveryState.COMPLETED, {
      result,
      completedAt: new Date(),
    });
  }

  // ==================================================
  // MARK FAILURE
  // ==================================================
  async markFailed(
    recoveryKey: string,
    error: string,
  ): Promise<void> {
    await this.updateState(recoveryKey, RecoveryState.FAILED, {
      error,
      failedAt: new Date(),
    });
  }

  // ==================================================
  // INCREMENT ATTEMPTS
  // ==================================================
  async incrementAttempts(recoveryKey: string): Promise<void> {
    const key = this.buildKey(recoveryKey);

    const raw = await this.redis.get(key);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      data.attempts = (data.attempts || 0) + 1;

      await this.redis.set(
        key,
        JSON.stringify(data),
        'EX',
        this.TTL_SECONDS,
      );

      this.logger.debug(
        `[RECOVERY_ATTEMPT_INCREMENT] key=${recoveryKey} attempts=${data.attempts}`,
      );
    } catch (err) {
      this.logger.error(`[RECOVERY_ATTEMPT_ERROR] key=${recoveryKey}`);
    }
  }

  // ==================================================
  // DELETE RECOVERY STATE
  // ==================================================
  async delete(recoveryKey: string): Promise<void> {
    await this.redis.del(this.buildKey(recoveryKey));
    this.logger.debug(`[RECOVERY_DELETED] key=${recoveryKey}`);
  }

  // ==================================================
  // INTERNAL KEY NAMESPACE
  // ==================================================
  private buildKey(key: string): string {
    return `protection:recovery:${key}`;
  }
}
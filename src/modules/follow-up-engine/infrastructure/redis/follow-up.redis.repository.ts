// FILE: src/modules/follow-up-engine/infrastructure/redis/follow-up.redis.repository.ts

import { Injectable } from '@nestjs/common';


import {
  FollowUpRepository,
  FindPendingFollowUpsInput,
  FindScheduledBeforeInput,
  ExistsActiveFollowUpInput,
  CancelFollowUpInput,
} from '../../domain/repositories/follow-up.repository';

  import { FollowUpJobEntity, FollowUpChannel, FollowUpJobStatus } from '../../domain/entities/follow-up-job.entity';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';
import {
  FollowUpTriggerVO,
  FollowUpTriggerType,
} from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * FollowUpRedisRepository
 * -------------------------------------------------------
 * Redis operational persistence layer
 * for follow-up jobs.
 *
 * Responsibilities:
 * - store follow-up jobs
 * - retrieve scheduled jobs
 * - cancel jobs
 * - duplicate prevention
 * - operational querying
 *
 * IMPORTANT:
 * This becomes the operational source of truth.
 */

@Injectable()
export class FollowUpRedisRepository
  implements FollowUpRepository
{
  // ==================================================
  // 🗂️ REDIS KEY PREFIXES
  // ==================================================

  private readonly KEY_PREFIX =
    'followup:job';

  private readonly USER_INDEX =
    'followup:user';

  constructor(
    private readonly redis: any,
  ) {}

  // ==================================================
  // 🏗️ CREATE
  // ==================================================

  async create(
    job: FollowUpJobEntity,
  ): Promise<FollowUpJobEntity> {
    const key = this.buildKey(job.id);

    await this.redis.set(
      key,
      JSON.stringify(job.toJSON()),
    );

    // ------------------------------------------------
    // USER INDEX
    // ------------------------------------------------

    await this.redis.sadd(
      this.buildUserIndex(
        job.tenantId,
        job.userId,
      ),
      job.id,
    );

    return job;
  }

  // ==================================================
  // ♻️ UPDATE
  // ==================================================

  async update(
    job: FollowUpJobEntity,
  ): Promise<FollowUpJobEntity> {
    const key = this.buildKey(job.id);

    await this.redis.set(
      key,
      JSON.stringify(job.toJSON()),
    );

    return job;
  }

  // ==================================================
  // ⏳ FIND PENDING
  // ==================================================

  async findPending(
    input?: FindPendingFollowUpsInput,
  ): Promise<FollowUpJobEntity[]> {
    const jobs = await this.getAllJobs();

    return jobs
      .filter((job) => {
        if (
          !['PENDING', 'SCHEDULED'].includes(
            job.status,
          )
        ) {
          return false;
        }

        if (
          input?.tenantId &&
          job.tenantId !== input.tenantId
        ) {
          return false;
        }

        if (
          input?.userId &&
          job.userId !== input.userId
        ) {
          return false;
        }

        if (
          input?.type &&
          job.type !== input.type
        ) {
          return false;
        }

        return true;
      })
      .slice(0, input?.limit ?? 100);
  }

  // ==================================================
  // 🚫 CANCEL
  // ==================================================

  async cancel(
    input: CancelFollowUpInput,
  ): Promise<void> {
    const job =
      await this.findById(
        input.followUpId,
      );

    if (!job) {
      return;
    }

    job.cancel(input.reason);

    await this.update(job);
  }

  // ==================================================
  // 👤 FIND BY USER
  // ==================================================

  async findByUser(
    tenantId: string,
    userId: string,
  ): Promise<FollowUpJobEntity[]> {
    const ids = await this.redis.smembers(
      this.buildUserIndex(
        tenantId,
        userId,
      ),
    );

    const jobs = await Promise.all(
      ids.map((id: string) =>
        this.findById(id),
      ),
    );

    return jobs.filter(
      Boolean,
    ) as FollowUpJobEntity[];
  }

  // ==================================================
  // ⏱️ FIND SCHEDULED BEFORE
  // ==================================================

  async findScheduledBefore(
    input: FindScheduledBeforeInput,
  ): Promise<FollowUpJobEntity[]> {
    const jobs = await this.getAllJobs();

    return jobs
      .filter((job) => {
        if (
          !['PENDING', 'SCHEDULED'].includes(
            job.status,
          )
        ) {
          return false;
        }

        return (
          job.schedule.scheduledAt.getTime() <=
          input.before.getTime()
        );
      })
      .slice(0, input.limit ?? 100);
  }

  // ==================================================
  // 🔁 EXISTS ACTIVE FOLLOW-UP
  // ==================================================

  async existsActiveFollowUp(
    input: ExistsActiveFollowUpInput,
  ): Promise<boolean> {
    const jobs =
      await this.findByUser(
        input.tenantId,
        input.userId,
      );

    return jobs.some(
      (job) =>
        job.type === input.type &&
        !job.isTerminal(),
    );
  }

  // ==================================================
  // 🔎 FIND BY ID
  // ==================================================

  async findById(
    id: string,
  ): Promise<FollowUpJobEntity | null> {
    const raw = await this.redis.get(
      this.buildKey(id),
    );

    if (!raw) {
      return null;
    }

    return this.deserialize(raw);
  }

  // ==================================================
  // 📦 GET ALL JOBS
  // ==================================================

  private async getAllJobs(): Promise<
    FollowUpJobEntity[]
  > {
    const keys = await this.redis.keys(
      `${this.KEY_PREFIX}:*`,
    );

    if (!keys.length) {
      return [];
    }

    const rows = await Promise.all(
      keys.map((key: string) =>
        this.redis.get(key),
      ),
    );

    return rows
      .filter(Boolean)
      .map((row: any) =>
        this.deserialize(row as string),
      );
  }

  // ==================================================
  // 🔑 REDIS KEY BUILDERS
  // ==================================================

  private buildKey(id: string) {
    return `${this.KEY_PREFIX}:${id}`;
  }

  private buildUserIndex(
    tenantId: string,
    userId: string,
  ) {
    return `${this.USER_INDEX}:${tenantId}:${userId}`;
  }

  // ==================================================
  // 🧠 DESERIALIZER
  // ==================================================

  private deserialize(
    raw: string,
  ): FollowUpJobEntity {
    const parsed = JSON.parse(raw);

    return new FollowUpJobEntity({
      id: parsed.id,

      tenantId: parsed.tenantId,

      userId: parsed.userId,

      type:
        parsed.type as FollowUpType,

      status:
        parsed.status as FollowUpJobStatus,

      channel:
        parsed.channel as FollowUpChannel,

      payload: parsed.payload,

      retryCount:
        parsed.retryCount,

      maxRetries:
        parsed.maxRetries,

      createdAt: new Date(
        parsed.createdAt,
      ),

      updatedAt: new Date(
        parsed.updatedAt,
      ),

      cancelledAt: parsed.cancelledAt
        ? new Date(parsed.cancelledAt)
        : undefined,

      completedAt: parsed.completedAt
        ? new Date(parsed.completedAt)
        : undefined,

      failedAt: parsed.failedAt
        ? new Date(parsed.failedAt)
        : undefined,

      schedule:
        new FollowUpScheduleVO({
          scheduledAt: new Date(
            parsed.schedule.scheduledAt,
          ),

          delayMs:
            parsed.schedule.delayMs,

          retryWindowMs:
            parsed.schedule
              .retryWindowMs,

          timezone:
            parsed.schedule.timezone,
        }),

      trigger:
        new FollowUpTriggerVO({
          type:
            parsed.trigger
              .type as FollowUpTriggerType,

          source:
            parsed.trigger.source,

          reason:
            parsed.trigger.reason,

          triggeredAt: new Date(
            parsed.trigger.typeedAt,
          ),

          metadata:
            parsed.trigger.metadata,
        }),
    });
  }
}
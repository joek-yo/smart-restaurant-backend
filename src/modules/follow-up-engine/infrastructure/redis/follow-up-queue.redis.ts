// FILE: src/modules/follow-up-engine/infrastructure/redis/follow-up-queue.redis.ts

import { Injectable, Logger } from '@nestjs/common';

import IORedis, {
  Redis,
  RedisOptions,
} from 'ioredis';

/**
 * FollowUpQueueRedis
 * -------------------------------------------------------
 * CENTRAL REDIS CONNECTION PROVIDER
 * FOR FOLLOW-UP QUEUES.
 *
 * Responsibilities:
 * - BullMQ Redis connection
 * - shared queue connection
 * - connection lifecycle
 * - reconnect strategy
 * - observability
 *
 * IMPORTANT:
 * Single source of truth for queue Redis.
 * Prevents duplicated queue connections.
 */

@Injectable()
export class FollowUpQueueRedis {
  private readonly logger = new Logger(
    FollowUpQueueRedis.name,
  );

  // ==================================================
  // 🔌 REDIS CLIENT
  // ==================================================

  private readonly client: Redis;

  constructor() {
    const config: RedisOptions = {
      host:
        process.env.REDIS_HOST ??
        'localhost',

      port: Number(
        process.env.REDIS_PORT ?? 6379,
      ),

      password:
        process.env.REDIS_PASSWORD,

      maxRetriesPerRequest: null,

      enableReadyCheck: true,

      lazyConnect: true,

      retryStrategy: (times) => {
        const delay = Math.min(
          times * 1000,
          10000,
        );

        this.logger.warn(
          `[FOLLOW_UP_REDIS_RETRY] attempt=${times} delay=${delay}`,
        );

        return delay;
      },
    };

    this.client = new IORedis(config);

    this.registerListeners();
  }

  // ==================================================
  // 🔓 GET CLIENT
  // ==================================================

  getClient(): Redis {
    return this.client;
  }

  // ==================================================
  // 🔌 CONNECT
  // ==================================================

  async connect(): Promise<void> {
    if (
      this.client.status === 'ready' ||
      this.client.status === 'connecting'
    ) {
      return;
    }

    await this.client.connect();

    this.logger.log(
      '[FOLLOW_UP_REDIS_CONNECTED]',
    );
  }

  // ==================================================
  // ❌ DISCONNECT
  // ==================================================

  async disconnect(): Promise<void> {
    await this.client.quit();

    this.logger.warn(
      '[FOLLOW_UP_REDIS_DISCONNECTED]',
    );
  }

  // ==================================================
  // ❤️ HEALTH CHECK
  // ==================================================

  async ping(): Promise<boolean> {
    try {
      const result =
        await this.client.ping();

      return result === 'PONG';
    } catch (error) {
      this.logger.error(
        '[FOLLOW_UP_REDIS_PING_FAILED]',
        error instanceof Error
          ? error.stack
          : undefined,
      );

      return false;
    }
  }

  // ==================================================
  // 📊 CONNECTION STATUS
  // ==================================================

  getStatus() {
    return {
      status: this.client.status,
    };
  }

  // ==================================================
  // 📡 OBSERVABILITY
  // ==================================================

  private registerListeners() {
    this.client.on(
      'connect',
      () => {
        this.logger.log(
          '[FOLLOW_UP_REDIS_CONNECTING]',
        );
      },
    );

    this.client.on(
      'ready',
      () => {
        this.logger.log(
          '[FOLLOW_UP_REDIS_READY]',
        );
      },
    );

    this.client.on(
      'error',
      (error) => {
        this.logger.error(
          '[FOLLOW_UP_REDIS_ERROR]',
          error?.stack,
        );
      },
    );

    this.client.on(
      'close',
      () => {
        this.logger.warn(
          '[FOLLOW_UP_REDIS_CLOSED]',
        );
      },
    );

    this.client.on(
      'reconnecting',
      () => {
        this.logger.warn(
          '[FOLLOW_UP_REDIS_RECONNECTING]',
        );
      },
    );
  }
}
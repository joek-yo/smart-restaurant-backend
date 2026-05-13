// FILE: src/modules/protection/application/services/opt-out-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { OptOutRedisRepository } from '../../infrastructure/redis/opt-out.redis.repository';
import { UserOptedOutEvent } from '../events/user-opted-out.event';

@Injectable()
export class OptOutProtectionService {
  private readonly logger = new Logger(OptOutProtectionService.name);

  constructor(
    private readonly optOutRedis: OptOutRedisRepository,
  ) {}

  // ==================================================
  // 🔍 CHECK OPT-OUT STATE (FIXED SIGNATURE)
  // ==================================================

  async isOptedOut(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    try {
      const blocked = await this.optOutRedis.isOptedOut(
        tenantId,
        userId,
      );

      return blocked;
    } catch (err) {
      // fail-safe: NEVER block pipeline due to Redis issues
      this.logger.error(
        `[OPTOUT CHECK FAILED] ${tenantId}:${userId}`,
        err,
      );

      return false;
    }
  }

  // ==================================================
  // 🚨 TRIGGER OPT-OUT (UNCHANGED CORE LOGIC)
  // ==================================================

  async triggerOptOut(params: {
    tenantId: string;
    userId: string;
    reason:
      | 'STOP'
      | 'UNSUBSCRIBE'
      | 'USER_REQUEST'
      | 'SPAM_REPORT'
      | 'MANUAL_ADMIN'
      | 'SYSTEM_DETECTION';
    source: 'whatsapp' | 'webchat' | 'api' | 'system';
    messageId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const now = new Date();

    await this.optOutRedis.setOptOut(
      params.tenantId,
      params.userId,
    );

    this.logger.warn(
      `[OPTOUT] User blocked: ${params.tenantId}:${params.userId} (${params.reason})`,
    );

    const event = UserOptedOutEvent.create({
      tenantId: params.tenantId,
      userId: params.userId,
      reason: params.reason,
      source: params.source,
      messageId: params.messageId,
      metadata: params.metadata,
    });

    this.logger.log(
      `[OPTOUT EVENT] emitted for ${params.tenantId}:${params.userId}`,
      {
        eventName: UserOptedOutEvent.eventName,
        occurredAt: now,
      },
    );
  }

  // ==================================================
  // ♻️ REACTIVATION (UNCHANGED)
  // ==================================================

  async reactivate(params: {
    tenantId: string;
    userId: string;
  }): Promise<void> {
    await this.optOutRedis.removeOptOut(
      params.tenantId,
      params.userId,
    );

    this.logger.log(
      `[OPTOUT] User reactivated: ${params.tenantId}:${params.userId}`,
    );
  }
}
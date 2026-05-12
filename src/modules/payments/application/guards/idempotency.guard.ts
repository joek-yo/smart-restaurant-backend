// src/modules/payments/application/guards/idempotency.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
} from '@nestjs/common';

import { Request } from 'express';
import { PaymentIdempotencyRepository } from '../repositories/payment-idempotency.repository';

/**
 * Redis abstraction (you should already have or plug later)
 */
interface RedisService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
}

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly idempotencyRepo: PaymentIdempotencyRepository,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const idempotencyKey =
      (request.headers['idempotency-key'] ||
        request.headers['x-idempotency-key']) as string;

    const contextType = this.resolveContext(request);

    if (!idempotencyKey) {
      throw new ConflictException('Missing idempotency key');
    }

    const lockKey = this.buildLockKey(idempotencyKey, contextType);

    // =====================================================
    // ⚡ LAYER 1: REDIS FAST CACHE CHECK
    // =====================================================
    const cached = await this.redis.get(lockKey);

    if (cached) {
      (request as any).idempotentResult = JSON.parse(cached);
      return true;
    }

    // =====================================================
    // 🧱 LAYER 2: DISTRIBUTED LOCK (RACE CONDITION BLOCKER)
    // =====================================================
    const lockAcquired = await this.redis.setNX(lockKey, 'LOCKED', 30);

    if (!lockAcquired) {
      // Another request is already processing this
      throw new ConflictException(
        'Duplicate request in progress (idempotency lock active)',
      );
    }

    // =====================================================
    // 🧾 LAYER 3: DB FALLBACK CHECK (TRUTH SOURCE)
    // =====================================================
    const existing =
      await this.idempotencyRepo.findByKeyAndContext(
        idempotencyKey,
        contextType,
      );

    if (existing) {
      await this.redis.set(lockKey, JSON.stringify(existing), 3600);

      (request as any).idempotentResult = existing;
      return true;
    }

    // attach lock info for downstream release/commit
    (request as any).idempotencyLockKey = lockKey;

    return true;
  }

  /**
   * =========================
   * CONTEXT RESOLUTION
   * =========================
   */
  private resolveContext(request: Request):
    | 'checkout'
    | 'webhook'
    | 'refund'
    | 'reconciliation' {
    const path = request.route?.path || request.path;

    if (path.includes('checkout')) return 'checkout';
    if (path.includes('webhook')) return 'webhook';
    if (path.includes('refund')) return 'refund';

    return 'checkout';
  }

  /**
   * =========================
   * LOCK KEY STRATEGY
   * =========================
   */
  private buildLockKey(key: string, context: string): string {
    return `idempotency:${context}:${key}`;
  }
}
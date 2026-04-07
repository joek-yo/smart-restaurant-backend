// 📁 src/domains/sessions/sessions.module.ts

import { Module } from '@nestjs/common';
import { SessionManagerService } from './services/session-manager.service';
import { CartRecoveryService } from './services/cart-recovery.service';
import { SessionLoggerService } from './services/session-logger.service';
import { SessionRouterService } from './services/session-router.service';
import { UpsellEngineService } from './services/upsell-engine.service';
import { ValidationService } from './services/validation.service';

import { InMemorySessionRepository, SessionRepository } from './repositories/session.repository';
import { InMemoryCartItemRepository, CartItemRepository } from './repositories/cart-item.repository';
import { InMemorySessionCacheRepository, RedisSessionCacheRepository, SessionCacheRepository } from './repositories/session-cache.repository';

import { SessionController } from './interfaces/session.controller';

import { SessionQueueProcessor } from './queues/session-queue.processor';
import { AbandonedCartQueue } from './queues/abandoned-cart-queue';
import { RetryQueue } from './queues/retry-queue';

import { WhatsappSessionAdapter } from './adapters/whatsapp-session.adapter';
import { PaymentSessionAdapter } from './adapters/payment-session.adapter';
import { AnalyticsAdapter } from './adapters/analytics.adapter';
import { AiUpsellAdapter } from './adapters/ai-upsell.adapter';

@Module({
  controllers: [SessionController],
  providers: [
    // Services
    SessionManagerService,
    CartRecoveryService,
    SessionLoggerService,
    SessionRouterService,
    UpsellEngineService,
    ValidationService,

    // Repositories
    { provide: SessionRepository, useClass: InMemorySessionRepository },
    { provide: CartItemRepository, useClass: InMemoryCartItemRepository },
    { provide: SessionCacheRepository, useClass: RedisSessionCacheRepository }, // swap to InMemorySessionCacheRepository if no Redis

    // Adapters
    WhatsappSessionAdapter,
    PaymentSessionAdapter,
    AnalyticsAdapter,
    AiUpsellAdapter,

    // Queues / Processors
    SessionQueueProcessor,
    AbandonedCartQueue,
    RetryQueue,
  ],
  exports: [
    SessionManagerService,
    CartRecoveryService,
    SessionLoggerService,
    SessionRouterService,
    UpsellEngineService,
    ValidationService,
    SessionRepository,
    CartItemRepository,
    SessionCacheRepository,
  ],
})
export class SessionsModule {}
// FILE: src/domains/sessions/sessions.module.ts

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import Redis from 'ioredis';

// =========================
// CONTROLLER
// =========================
import { SessionController } from './sessions.controller';

// =========================
// CORE SERVICE
// =========================
import { SessionService } from './services/session.service';

// =========================
// USE CASES
// =========================
import { AddToCartUseCase } from './use-cases/add-to-cart.use-case';
import { RemoveFromCartUseCase } from './use-cases/remove-from-cart.use-case';
import { UpdateQuantityUseCase } from './use-cases/update-quantity.use-case';
import { CheckoutUseCase } from './use-cases/checkout.use-case';

// =========================
// REPOSITORIES
// =========================
import {
  SessionRepository,
  InMemorySessionRepository,
} from './repositories/session.repository';

import {
  CartItemRepository,
  InMemoryCartItemRepository,
} from './repositories/cart-item.repository';

import { SessionCacheRepository } from './repositories/session-cache.repository';
import { RedisSessionCacheRepository } from './repositories/session-cache.redis.repository';
import { SessionIndexRepository } from './repositories/session-index.repository';

// =========================
// REDIS PROVIDER (Dev Only)
// =========================
const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: 'localhost',
      port: 6379,
    });
  },
};

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [SessionController],
  providers: [
    redisProvider, 
    
    // Core Services
    SessionService,

    // Use Cases
    AddToCartUseCase,
    RemoveFromCartUseCase,
    UpdateQuantityUseCase,
    CheckoutUseCase,

    // Repositories
    {
      provide: SessionRepository,
      useClass: InMemorySessionRepository,
    },
    {
      provide: CartItemRepository,
      useClass: InMemoryCartItemRepository,
    },
    {
      provide: SessionCacheRepository,
      useClass: RedisSessionCacheRepository,
    },
    SessionIndexRepository,
  ],
  exports: [
    SessionService,
    SessionRepository,
    CartItemRepository,
    SessionCacheRepository,
    SessionIndexRepository,
    'REDIS_CLIENT',
  ],
})
export class SessionsModule {}
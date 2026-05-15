// FILE: src/modules/sessions/sessions.module.ts

import { Module, Global } from '@nestjs/common';
import { CoreEventModule } from '../../core/events/core-event.module';
import { Redis } from 'ioredis';

// ==========================
// DOMAIN
// ==========================
import { SessionEntity } from './domain/entities/session.entity';
import { CartItemEntity } from './domain/entities/cart-item.entity';

// ==========================
// REPOSITORIES
// ==========================
import {
  SessionRepository,
  InMemorySessionRepository,
} from './domain/repositories/session.repository';

import {
  CartItemRepository,
  InMemoryCartItemRepository,
} from './domain/repositories/cart-item.repository';

import {
  SessionCacheRepository,
  RedisSessionCacheRepository,
} from './domain/repositories/session-cache.repository';

// ==========================
// SERVICES (DOMAIN LOGIC)
// ==========================
import { SessionService } from './application/services/session.service';
import { CartService } from './application/services/cart.service';

// ==========================
// USE CASES
// ==========================
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { UpdateQuantityUseCase } from './application/use-cases/update-quantity.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { GetOrCreateSessionUseCase } from './application/use-cases/get-or-create-session.use-case';

// ==========================
// FACTORIES / HELPERS
// ==========================

// ==========================
// REDIS PROVIDER
// ==========================
const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
};

// ==========================
// MODULE
// ==========================

@Global()
@Module({
  imports: [CoreEventModule],
  providers: [
    // --------------------------
    // INFRASTRUCTURE
    // --------------------------
    redisProvider,

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

    // --------------------------
    // CORE SERVICES
    // --------------------------
    SessionService,
    CartService,

    // --------------------------
    // USE CASES
    // --------------------------
    AddCartItemUseCase,
    RemoveCartItemUseCase,
    UpdateQuantityUseCase,
    ClearCartUseCase,
    GetOrCreateSessionUseCase,

    // --------------------------
    // FACTORIES
    // --------------------------
  ],

  exports: [
    'REDIS_CLIENT',
    // Core service
    SessionService,

    // Use cases (used by checkout + conversation)
    AddCartItemUseCase,
    RemoveCartItemUseCase,
    UpdateQuantityUseCase,
    ClearCartUseCase,
    GetOrCreateSessionUseCase,

    // Repositories (needed by checkout engine)
    SessionRepository,
    CartItemRepository,
    SessionCacheRepository,
  ],
})
export class SessionsModule {}
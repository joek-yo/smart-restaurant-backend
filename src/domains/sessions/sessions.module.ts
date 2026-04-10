// FILE: src/domains/sessions/sessions.module.ts

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controller
import { SessionController } from './sessions.controller';

// Services
import { SessionManagerService } from './services/session-manager.service';
import { SessionRouterService } from './services/session-router.service';

// Repositories
import {
  SessionRepository,
  InMemorySessionRepository,
} from './repositories/session.repository';

import {
  CartItemRepository,
  InMemoryCartItemRepository,
} from './repositories/cart-item.repository';

import {
  SessionCacheRepository,
  RedisSessionCacheRepository,
} from './repositories/session-cache.repository';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],

  controllers: [SessionController],

  providers: [
    SessionManagerService,
    SessionRouterService,

    // =========================
    // REDIS DISABLED (SAFE MODE)
    // =========================
    {
      provide: 'REDIS_CLIENT',
      useValue: null,
    },

    // =========================
    // REPOSITORIES
    // =========================
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
  ],

  exports: [
    SessionManagerService,
    SessionRepository,
    CartItemRepository,
    SessionCacheRepository,
  ],
})
export class SessionsModule {}
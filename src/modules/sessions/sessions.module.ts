// src/modules/sessions/sessions.module.ts

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import Redis from 'ioredis';

import { SessionController } from './presentation/sessions.controller';
import { SessionService } from './application/services/session.service';

import { AddToCartUseCase } from './application/use-cases/add-to-cart.use-case';
import { RemoveFromCartUseCase } from './application/use-cases/remove-from-cart.use-case';
import { UpdateQuantityUseCase } from './application/use-cases/update-quantity.use-case';
import { CheckoutUseCase } from './application/use-cases/checkout.use-case';

import { SessionRepository, InMemorySessionRepository } from './domain/repositories/session.repository';
import { CartItemRepository, InMemoryCartItemRepository } from './domain/repositories/cart-item.repository';
import { SessionCacheRepository } from './domain/repositories/session-cache.repository';
import { RedisSessionCacheRepository } from './infrastructure/repositories/session-cache.redis.repository';
import { SessionIndexRepository } from './infrastructure/repositories/session-index.repository';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
};

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [SessionController],
  providers: [
    redisProvider,
    SessionService,
    AddToCartUseCase,
    RemoveFromCartUseCase,
    UpdateQuantityUseCase,
    CheckoutUseCase,
    { provide: SessionRepository, useClass: InMemorySessionRepository },
    { provide: CartItemRepository, useClass: InMemoryCartItemRepository },
    { provide: SessionCacheRepository, useClass: RedisSessionCacheRepository },
    SessionIndexRepository,
  ],
  exports: [SessionService, SessionRepository, CartItemRepository, SessionCacheRepository, SessionIndexRepository, 'REDIS_CLIENT'],
})
export class SessionsModule {}

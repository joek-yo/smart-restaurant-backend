// src/modules/conversation/conversation.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import Redis from 'ioredis';

// Presentation
import { WhatsappController } from './presentation/whatsapp.controller';
import { WebChatController } from './presentation/webchat.controller';
import { ApiController } from './presentation/api.controller';

// Engine
import { ConversationEngineService } from './application/services/conversation-engine.service';
import { StateMachineService } from './application/services/state-machine.service';
import { TransitionResolverService } from './application/services/transition-resolver.service';

// Use Cases
import { ProcessMessageUseCase } from './application/use-cases/process-message.use-case';
import { LoadContextUseCase } from './application/use-cases/load-context.use-case';
import { ResolveIntentUseCase } from './application/use-cases/resolve-intent.use-case';
import { ResolveTransitionUseCase } from './application/use-cases/resolve-transition.use-case';
import { EmitEventsUseCase } from './application/use-cases/emit-events.use-case';
import { BuildResponseUseCase } from './application/use-cases/build-response.use-case';
import { PersistContextUseCase } from './application/use-cases/persist-context.use-case';

// Listeners
import { ConversationEventListener } from './application/listeners/conversation.listener';

// Infrastructure
import { WhatsAppAdapter } from './infrastructure/adapters/whatsapp.adapter';
import { WebChatAdapter } from './infrastructure/adapters/webchat.adapter';
import { ApiAdapter } from './infrastructure/adapters/api.adapter';
import { ConversationRedisRepository } from './infrastructure/redis/conversation.redis.repository';

// Core
import { EventBus } from '@core/events/event.bus';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
};

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [
    WhatsappController,
    WebChatController,
    ApiController,
  ],
  providers: [
    // Redis
    redisProvider,
    ConversationRedisRepository,

    // Core event bus
    EventBus,

    // Engine services
    ConversationEngineService,
    StateMachineService,
    TransitionResolverService,

    // Use cases
    ProcessMessageUseCase,
    LoadContextUseCase,
    ResolveIntentUseCase,
    ResolveTransitionUseCase,
    EmitEventsUseCase,
    BuildResponseUseCase,
    PersistContextUseCase,

    // Listeners
    ConversationEventListener,

    // Adapters
    WhatsAppAdapter,
    WebChatAdapter,
    ApiAdapter,
  ],
  exports: [
    ConversationEngineService,
    redisProvider,
  ],
})
export class ConversationModule {}

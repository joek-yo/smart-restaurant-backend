import { CoreEventModule } from '@core/events/core-event.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Registries
import { ActionRegistry } from './application/actions/action.registry';
import { ResolverRegistry } from './application/resolvers/resolver.registry';

// Resolvers
import { KeywordResolver } from './application/resolvers/keyword.resolver';
import { CommerceResolver } from './application/resolvers/commerce.resolver';
import { AiResolver } from './application/resolvers/ai.resolver';
import { FallbackResolver } from './application/resolvers/fallback.resolver';

// Actions
import { AddToCartAction } from './application/actions/add-to-cart.action';
import { CheckoutAction } from './application/actions/checkout.action';
import { ViewCartAction } from './application/actions/view-cart.action';
import { ViewProductsAction } from './application/actions/view-products.action';
import { SendMessageAction } from './application/actions/send-message.action';
import { CancelOrderAction } from './application/actions/cancel-order.action';
import { HandoverAction } from './application/actions/handover.action';
import { StartFlowAction } from './application/actions/start-flow.action';

// Services
import { ConversationOrchestratorService } from './application/orchestrators/conversation-orchestrator.service';
import { ConversationEngineService } from './application/services/conversation-engine.service';
import { IntentClassifierService } from './application/services/intent-classifier.service';
import { StateMachineService } from './application/services/state-machine.service';
import { ResponseBuilderService } from './application/services/response-builder.service';
import { RecoveryEngineService } from './application/services/recovery-engine.service';
import { ContextPolicyService } from './application/services/context-policy.service';
import { ConversationHistoryService } from './application/services/conversation-history.service';
import { MemoryWindowService } from './application/services/memory-window.service';
import { ContextVaultService } from './application/services/context-vault.service';
import { SemanticContextService } from './application/services/semantic-context.service';
import { FlowEngine } from './application/flows/flow.engine';
import { FlowRegistry } from './application/flows/flow.registry';
import { OnboardingFlow } from './application/flows/onboarding.flow';
import { AbandonedCartFlow } from './application/flows/abandoned-cart.flow';
import { ReorderFlow } from './application/flows/reorder.flow';
import { EscalationFlow } from './application/flows/escalation.flow';
import { ConversationMetrics } from './infrastructure/observability/conversation.metrics';
import { PipelineTracerService } from './infrastructure/observability/pipeline-tracer.service';
import { QueueMonitorService } from './infrastructure/observability/queue-monitor.service';
import { OrchestrationLoggerService } from './infrastructure/observability/orchestration-logger.service';
import { WhatsAppRetryService } from './infrastructure/adapters/whatsapp/whatsapp-retry.service';
import { WhatsAppDeliveryService } from './infrastructure/adapters/whatsapp/whatsapp-delivery.service';
import { WhatsAppIdempotencyService } from './infrastructure/adapters/whatsapp/whatsapp-idempotency.service';
import { WhatsAppRateLimitService } from './infrastructure/adapters/whatsapp/whatsapp-rate-limit.service';
import { WhatsAppSendReplyService } from './infrastructure/adapters/whatsapp/whatsapp-send-reply.service';
import { WhatsAppEventListener } from './infrastructure/adapters/whatsapp/whatsapp-event.listener';
import { ConversationEventMapperService } from './application/services/conversation-event-mapper.service';

// Pipelines
import { ConversationPipelineEngine } from './application/pipelines/conversation.pipeline.engine';
import { InboundMessagePipeline } from './application/pipelines/inbound-message.pipeline';
import { OutboundMessagePipeline } from './application/pipelines/outbound-message.pipeline';
import { MiddlewarePipeline } from './application/pipelines/middleware.pipeline';

// Use-cases
import { ProcessMessageUseCase } from './application/use-cases/process-message.use-case';
import { LoadContextUseCase } from './application/use-cases/load-context.use-case';
import { PersistContextUseCase } from './application/use-cases/persist-context.use-case';
import { ResolveIntentUseCase } from './application/use-cases/resolve-intent.use-case';
import { ExecuteActionUseCase } from './application/use-cases/execute-action.use-case';
import { BuildResponseUseCase } from './application/use-cases/build-response.use-case';
import { EmitEventsUseCase } from './application/use-cases/emit-events.use-case';
import { RecoverConversationUseCase } from './application/use-cases/recover-conversation.use-case';

// Policies
import { AbuseProtectionPolicy } from './application/policies/abuse-protection.policy';
import { LockedStatePolicy } from './application/policies/locked-state.policy';
import { TransitionGuardPolicy } from './application/policies/transition-guard.policy';

// Event Handlers
import { ConversationPaymentConfirmedHandler } from './application/event-handlers/payment-confirmed.handler';
import { ConversationPaymentFailedHandler } from './application/event-handlers/payment-failed.handler';
import { ConversationCheckoutConfirmedHandler } from './application/event-handlers/checkout-confirmed.handler';
import { ConversationOrderCreatedHandler } from './application/event-handlers/order-created.handler';
import { ConversationOrderCompletedHandler } from './application/event-handlers/order-completed.handler';
import { ConversationTimeoutHandler } from './application/event-handlers/conversation-timeout.handler';

// Listeners
import { ConversationEventListener } from './application/listeners/conversation.listener';

// Infrastructure
import { ConversationRedisRepository } from './infrastructure/redis/conversation.redis.repository';
import { WhatsAppAdapter } from './infrastructure/adapters/whatsapp.adapter';
import { WebChatAdapter } from './infrastructure/adapters/webchat.adapter';
import { ApiAdapter } from './infrastructure/adapters/api.adapter';
import { SessionsAdapter } from './infrastructure/adapters/sessions.adapter';
import { InboundMessageQueue } from './infrastructure/queues/inbound-message.queue';
import { OutboundMessageQueue } from './infrastructure/queues/outbound-message.queue';
import { DeadLetterQueue } from './infrastructure/queues/dead-letter.queue';
import { QueueManager } from './infrastructure/queues/queue.manager';

// Presentation
import { WebChatController } from './presentation/webchat.controller';
import { ApiController } from './presentation/api.controller';
import { WhatsappController } from './presentation/whatsapp.controller';
import { ChannelGateway } from './presentation/gateway/channel.gateway';
import { MessageRouter } from './presentation/gateway/message.router';

// External modules
import { SessionsModule } from '../sessions/sessions.module';
import { CatalogModule } from '../catalog';
import { OrdersModule } from '../orders/orders.module';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    CoreEventModule,
    ConfigModule,
    SessionsModule,
    CatalogModule,
    OrdersModule,
    CheckoutModule,
  ],
  controllers: [WebChatController, ApiController, WhatsappController],
  providers: [
    // Registries first — actions/resolvers depend on these
    ActionRegistry,
    ResolverRegistry,

    // Resolvers (self-register via onModuleInit)
    KeywordResolver,
    CommerceResolver,
    AiResolver,
    FallbackResolver,

    // Actions (self-register via onModuleInit)
    AddToCartAction,
    CheckoutAction,
    ViewCartAction,
    ViewProductsAction,
    SendMessageAction,
    CancelOrderAction,
    HandoverAction,
    StartFlowAction,

    // Services
    ConversationOrchestratorService,
    ConversationEngineService,
    IntentClassifierService,
    StateMachineService,
    ResponseBuilderService,
    RecoveryEngineService,
    ContextPolicyService,
    ConversationHistoryService,
    MemoryWindowService,
    ContextVaultService,
    SemanticContextService,
    FlowRegistry,
    FlowEngine,
    OnboardingFlow,
    AbandonedCartFlow,
    ReorderFlow,
    EscalationFlow,
    ConversationMetrics,
    PipelineTracerService,
    QueueMonitorService,
    OrchestrationLoggerService,
    WhatsAppRetryService,
    WhatsAppDeliveryService,
    WhatsAppIdempotencyService,
    WhatsAppRateLimitService,
    WhatsAppSendReplyService,
    WhatsAppEventListener,
    ConversationEventMapperService,

    // Pipelines
    ConversationPipelineEngine,
    InboundMessagePipeline,
    OutboundMessagePipeline,
    MiddlewarePipeline,

    // Use-cases
    ProcessMessageUseCase,
    LoadContextUseCase,
    PersistContextUseCase,
    ResolveIntentUseCase,
    ExecuteActionUseCase,
    BuildResponseUseCase,
    EmitEventsUseCase,
    RecoverConversationUseCase,

    // Policies
    AbuseProtectionPolicy,
    LockedStatePolicy,
    TransitionGuardPolicy,

    // Listeners
    ConversationEventListener,

    // Event Handlers (Phase 5 — Recovery)
    ConversationPaymentConfirmedHandler,
    ConversationPaymentFailedHandler,
    ConversationCheckoutConfirmedHandler,
    ConversationOrderCreatedHandler,
    ConversationOrderCompletedHandler,
    ConversationTimeoutHandler,

    // Infrastructure
    ConversationRedisRepository,
    WhatsAppSendReplyService,
    WhatsAppAdapter,
    WebChatAdapter,
    ApiAdapter,
    SessionsAdapter,
    InboundMessageQueue,
    OutboundMessageQueue,
    DeadLetterQueue,
    QueueManager,

    // Gateway
    ChannelGateway,
    MessageRouter,
  ],
  exports: [
    ActionRegistry,
    ResolverRegistry,
    ConversationOrchestratorService,
    ConversationRedisRepository,
    WhatsAppSendReplyService,
  ],
})
export class ConversationModule {}

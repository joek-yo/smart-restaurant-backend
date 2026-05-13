// FILE: src/modules/protection/protection.module.ts

import { Module } from '@nestjs/common';

// ======================================================
// EXISTING SYSTEM MODULES
// ======================================================

import { ConversationRedisRepository } from '../conversation/infrastructure/redis/conversation.redis.repository';

import { SessionService } from '../sessions/application/services/session.service';
import { SessionRecoveryService } from '../sessions/application/services/session-recovery.service';

import { CheckoutRecoveryService } from '../checkout/application/services/checkout-recovery.service';

import { QueueManager } from '../conversation/infrastructure/queues/queue.manager';
import { DeadLetterQueue as ConversationDeadLetterQueue } from '../conversation/infrastructure/queues/dead-letter.queue';

import { OrchestrationLoggerService } from '../conversation/infrastructure/observability/orchestration-logger.service';
import { PipelineTracerService } from '../conversation/infrastructure/observability/pipeline-tracer.service';

// ======================================================
// APPLICATION — COORDINATORS
// ======================================================

import { RecoveryCoordinatorService } from './application/coordinators/recovery-coordinator.service';
import { ProtectionCoordinatorService } from './application/coordinators/protection-coordinator.service';
import { WorkflowConsistencyService } from './application/coordinators/workflow-consistency.service';
import { DistributedLockCoordinatorService } from './application/coordinators/distributed-lock-coordinator.service';

// ======================================================
// APPLICATION — SERVICES
// ======================================================

import { SessionProtectionService } from './application/services/session-protection.service';
import { CheckoutProtectionService } from './application/services/checkout-protection.service';
import { PaymentProtectionService } from './application/services/payment-protection.service';
import { OrderProtectionService } from './application/services/order-protection.service';
import { ConversationProtectionService } from './application/services/conversation-protection.service';
import { IdempotencyProtectionService } from './application/services/idempotency-protection.service';
import { AbandonmentDetectionService } from './application/services/abandonment-detection.service';
import { RecoveryStateRestorerService } from './application/services/recovery-state-restorer.service';
import { StaleWorkflowDetectorService } from './application/services/stale-workflow-detector.service';
import { TenantIsolationGuardService } from './application/services/tenant-isolation-guard.service';
import { WorkflowRepairService } from './application/services/workflow-repair.service';
import { WorkflowTimelineService } from './application/services/workflow-timeline.service';

// ======================================================
// APPLICATION — USE CASES
// ======================================================

import { RecoverConversationUseCase } from './application/use-cases/recover-conversation.use-case';
import { RecoverCheckoutUseCase } from './application/use-cases/recover-checkout.use-case';
import { RecoverPaymentUseCase } from './application/use-cases/recover-payment.use-case';
import { RecoverSessionUseCase } from './application/use-cases/recover-session.use-case';
import { RepairStuckWorkflowUseCase } from './application/use-cases/repair-stuck-workflow.use-case';
import { HandleTimeoutUseCase } from './application/use-cases/handle-timeout.use-case';
import { HandleReconnectUseCase } from './application/use-cases/handle-reconnect.use-case';
import { HandleDuplicateMessageUseCase } from './application/use-cases/handle-duplicate-message.use-case';
import { ValidateWorkflowConsistencyUseCase } from './application/use-cases/validate-workflow-consistency.use-case';
import { RestoreAbandonedCartUseCase } from './application/use-cases/restore-abandoned-cart.use-case';

// ======================================================
// APPLICATION — STRATEGIES
// ======================================================

import { ConversationRecoveryStrategy } from './application/strategies/conversation-recovery.strategy';
import { CheckoutRecoveryStrategy } from './application/strategies/checkout-recovery.strategy';
import { PaymentRecoveryStrategy } from './application/strategies/payment-recovery.strategy';
import { SessionRecoveryStrategy } from './application/strategies/session-recovery.strategy';
import { AbandonedCartStrategy } from './application/strategies/abandoned-cart.strategy';
import { ReconnectRecoveryStrategy } from './application/strategies/reconnect-recovery.strategy';

// ======================================================
// APPLICATION — PIPELINES
// ======================================================

import { RecoveryPipeline } from './application/pipelines/recovery.pipeline';
import { WorkflowValidationPipeline } from './application/pipelines/workflow-validation.pipeline';
import { WorkflowRepairPipeline } from './application/pipelines/workflow-repair.pipeline';

// ======================================================
// INFRASTRUCTURE — REDIS
// ======================================================

import { WorkflowLockRedisRepository } from './infrastructure/redis/workflow-lock.redis.repository';
import { RecoveryRedisRepository } from './infrastructure/redis/recovery.redis.repository';
import { IdempotencyRedisRepository } from './infrastructure/redis/idempotency.redis.repository';
import { WorkflowCacheRedisRepository } from './infrastructure/redis/workflow-cache.redis.repository';
import { TenantScopeRedisRepository } from './infrastructure/redis/tenant-scope.redis.repository';

// ======================================================
// INFRASTRUCTURE — PERSISTENCE
// ======================================================

import { WorkflowTimelineMongoRepository } from './infrastructure/persistence/workflow-timeline.mongo.repository';
import { RecoverySessionMongoRepository } from './infrastructure/persistence/recovery-session.mongo.repository';
import { ProtectionReportMongoRepository } from './infrastructure/persistence/protection-report.mongo.repository';

// ======================================================
// INFRASTRUCTURE — QUEUES
// ======================================================

import { RecoveryQueue } from './infrastructure/queues/recovery.queue';
import { RetryQueue } from './infrastructure/queues/retry.queue';
import { TimeoutQueue } from './infrastructure/queues/timeout.queue';
import { DeadLetterQueue } from './infrastructure/queues/dead-letter.queue';
import { RecoveryWorker } from './infrastructure/queues/recovery.worker';
import { WorkflowRepairWorker } from './infrastructure/queues/workflow-repair.worker';

// ======================================================
// INFRASTRUCTURE — OBSERVABILITY
// ======================================================

import { ProtectionLoggerService } from './infrastructure/observability/protection-logger.service';
import { RecoveryTracerService } from './infrastructure/observability/recovery-tracer.service';
import { WorkflowMetricsService } from './infrastructure/observability/workflow-metrics.service';
import { AnomalyDetectorService } from './infrastructure/observability/anomaly-detector.service';
import { WorkflowHealthMonitorService } from './infrastructure/observability/workflow-health-monitor.service';

// ======================================================
// INFRASTRUCTURE — LOCKS
// ======================================================

import { RedisLockService } from './infrastructure/locks/redis-lock.service';
import { CheckoutLockService } from './infrastructure/locks/checkout-lock.service';
import { PaymentLockService } from './infrastructure/locks/payment-lock.service';
import { ConversationLockService } from './infrastructure/locks/conversation-lock.service';
import { OrderLockService } from './infrastructure/locks/order-lock.service';

// ======================================================
// INFRASTRUCTURE — SCHEDULERS
// ======================================================

import { AbandonedSessionScheduler } from './infrastructure/schedulers/abandoned-session.scheduler';
import { StaleWorkflowScheduler } from './infrastructure/schedulers/stale-workflow.scheduler';
import { RecoveryCleanupScheduler } from './infrastructure/schedulers/recovery-cleanup.scheduler';
import { WorkflowHealthScheduler } from './infrastructure/schedulers/workflow-health.scheduler';

// ======================================================
// INTERFACES — HTTP
// ======================================================

import { ProtectionController } from './interfaces/http/protection.controller';
import { RecoveryController } from './interfaces/http/recovery.controller';
import { WorkflowHealthController } from './interfaces/http/workflow-health.controller';

@Module({
  imports: [],

  controllers: [
    ProtectionController,
    RecoveryController,
    WorkflowHealthController,
  ],

  providers: [
    // ==================================================
    // EXISTING SYSTEM PROVIDERS
    // ==================================================

    ConversationRedisRepository,

    SessionService,
    SessionRecoveryService,

    CheckoutRecoveryService,

    QueueManager,
    ConversationDeadLetterQueue,

    OrchestrationLoggerService,
    PipelineTracerService,

    // ==================================================
    // COORDINATORS
    // ==================================================

    RecoveryCoordinatorService,
    ProtectionCoordinatorService,
    WorkflowConsistencyService,
    DistributedLockCoordinatorService,

    // ==================================================
    // SERVICES
    // ==================================================

    SessionProtectionService,
    CheckoutProtectionService,
    PaymentProtectionService,
    OrderProtectionService,
    ConversationProtectionService,
    IdempotencyProtectionService,
    AbandonmentDetectionService,
    RecoveryStateRestorerService,
    StaleWorkflowDetectorService,
    TenantIsolationGuardService,
    WorkflowRepairService,
    WorkflowTimelineService,

    // ==================================================
    // USE CASES
    // ==================================================

    RecoverConversationUseCase,
    RecoverCheckoutUseCase,
    RecoverPaymentUseCase,
    RecoverSessionUseCase,
    RepairStuckWorkflowUseCase,
    HandleTimeoutUseCase,
    HandleReconnectUseCase,
    HandleDuplicateMessageUseCase,
    ValidateWorkflowConsistencyUseCase,
    RestoreAbandonedCartUseCase,

    // ==================================================
    // STRATEGIES
    // ==================================================

    ConversationRecoveryStrategy,
    CheckoutRecoveryStrategy,
    PaymentRecoveryStrategy,
    SessionRecoveryStrategy,
    AbandonedCartStrategy,
    ReconnectRecoveryStrategy,

    // ==================================================
    // PIPELINES
    // ==================================================

    RecoveryPipeline,
    WorkflowValidationPipeline,
    WorkflowRepairPipeline,

    // ==================================================
    // REDIS
    // ==================================================

    WorkflowLockRedisRepository,
    RecoveryRedisRepository,
    IdempotencyRedisRepository,
    WorkflowCacheRedisRepository,
    TenantScopeRedisRepository,

    // ==================================================
    // PERSISTENCE
    // ==================================================

    WorkflowTimelineMongoRepository,
    RecoverySessionMongoRepository,
    ProtectionReportMongoRepository,

    // ==================================================
    // QUEUES
    // ==================================================

    RecoveryQueue,
    RetryQueue,
    TimeoutQueue,
    DeadLetterQueue,
    RecoveryWorker,
    WorkflowRepairWorker,

    // ==================================================
    // OBSERVABILITY
    // ==================================================

    ProtectionLoggerService,
    RecoveryTracerService,
    WorkflowMetricsService,
    AnomalyDetectorService,
    WorkflowHealthMonitorService,

    // ==================================================
    // LOCKS
    // ==================================================

    RedisLockService,
    CheckoutLockService,
    PaymentLockService,
    ConversationLockService,
    OrderLockService,

    // ==================================================
    // SCHEDULERS
    // ==================================================

    AbandonedSessionScheduler,
    StaleWorkflowScheduler,
    RecoveryCleanupScheduler,
    WorkflowHealthScheduler,
  ],

  exports: [
    // coordinators
    RecoveryCoordinatorService,
    ProtectionCoordinatorService,

    // services
    SessionProtectionService,
    CheckoutProtectionService,
    PaymentProtectionService,
    OrderProtectionService,
    ConversationProtectionService,
    WorkflowRepairService,

    // pipelines
    RecoveryPipeline,
    WorkflowValidationPipeline,

    // observability
    ProtectionLoggerService,
    RecoveryTracerService,
    WorkflowMetricsService,

    // locks
    RedisLockService,
    CheckoutLockService,
    PaymentLockService,
    ConversationLockService,
    OrderLockService,
  ],
})
export class ProtectionModule {}
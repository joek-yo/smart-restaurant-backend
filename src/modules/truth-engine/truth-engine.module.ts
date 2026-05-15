// FILE: src/modules/truth-engine/truth-engine.module.ts

import { Module, Global } from '@nestjs/common';

import { TruthEngineService } from './application/truth-engine.service';
import { TruthSnapshotBuilder } from './application/truth-snapshot.builder';
import { TruthNormalizerService } from './application/truth-normalizer.service';
import { TruthComputationService } from './application/truth-computation.service';

import { TruthCacheService } from './infrastructure/cache/truth-cache.service';
import { TruthEventSubscriber } from './infrastructure/events/truth-event.subscriber';

import { BusinessAdapter } from './infrastructure/adapters/business.adapter';
import { SessionAdapter } from './infrastructure/adapters/session.adapter';
import { CatalogAdapter } from './infrastructure/adapters/catalog.adapter';
import { ConversationAdapter } from './infrastructure/adapters/conversation.adapter';

/**
 * TruthEngineModule
 * ------------------
 * Global plugin module for the Truth Engine system.
 *
 * Responsibilities:
 * - Wire all adapters (Business, Session, Catalog, Conversation)
 * - Provide normalization + computation pipeline
 * - Register caching layer
 * - Attach event-driven invalidation subscriber
 * - Expose TruthEngineService as global API
 *
 * IMPORTANT:
 * This module is the SINGLE integration point for all systems
 * that depend on canonical "truth snapshots".
 */
@Global()
@Module({
  providers: [
    // =========================
    // CORE ENGINE SERVICES
    // =========================
    TruthEngineService,
    TruthSnapshotBuilder,
    TruthNormalizerService,
    TruthComputationService,

    // =========================
    // ADAPTERS (DATA GATEWAYS)
    // =========================
    BusinessAdapter,
    SessionAdapter,
    CatalogAdapter,
    ConversationAdapter,

    // =========================
    // INFRASTRUCTURE
    // =========================
    TruthCacheService,
    TruthEventSubscriber,
  ],
  exports: [
    // Expose ONLY the public API
    TruthEngineService,
  ],
})
export class TruthEngineModule {}
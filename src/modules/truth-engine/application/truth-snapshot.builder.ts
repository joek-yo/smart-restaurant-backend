// FILE: src/modules/truth-engine/application/truth-snapshot.builder.ts

import { Injectable } from '@nestjs/common';

import { TruthSnapshotEntity } from '../domain/truth-snapshot.entity';
import {
  TruthSnapshot,
  TruthSourceType,
  TenantId,
  SessionId,
  UserId,
} from '../domain/truth.types';

import { TruthNormalizerService } from './truth-normalizer.service';
import { TruthComputationService } from './truth-computation.service';

// Adapters (infrastructure layer - injected later in module wiring)
import { BusinessAdapter } from '../infrastructure/adapters/business.adapter';
import { SessionAdapter } from '../infrastructure/adapters/session.adapter';
import { CatalogAdapter } from '../infrastructure/adapters/catalog.adapter';
import { ConversationAdapter } from '../infrastructure/adapters/conversation.adapter';

/**
 * =====================================================
 * 🧠 TRUTH SNAPSHOT BUILDER (ASSEMBLY LINE)
 * =====================================================
 *
 * Responsibility:
 * - Fetch raw data from adapters
 * - Normalize all inputs
 * - Compute deterministic intelligence
 * - Assemble final immutable TruthSnapshotEntity
 *
 * This is the ONLY place where:
 * - adapters meet
 * - normalization happens
 * - computation is applied
 * - snapshot is formed
 * =====================================================
 */

@Injectable()
export class TruthSnapshotBuilder {
  constructor(
    private readonly normalizer: TruthNormalizerService,
    private readonly computation: TruthComputationService,

    private readonly businessAdapter: BusinessAdapter,
    private readonly sessionAdapter: SessionAdapter,
    private readonly catalogAdapter: CatalogAdapter,
    private readonly conversationAdapter: ConversationAdapter,
  ) {}

  /**
   * =====================================================
   * 🚀 MAIN BUILD METHOD
   * =====================================================
   */
  async build(input: {
    tenantId: TenantId;
    sessionId: SessionId;
    userId: UserId;
  }): Promise<TruthSnapshotEntity> {
    const { tenantId, sessionId, userId } = input;

    // =====================================================
    // 1. FETCH RAW DATA (ADAPTER LAYER)
    // =====================================================
    const [rawBusiness, rawSession, rawCatalog, rawConversation] =
      await Promise.all([
        this.businessAdapter.fetch({ tenantId }),
        this.sessionAdapter.fetch({ tenantId, sessionId, userId }),
        this.catalogAdapter.fetch({ tenantId }),
        this.conversationAdapter.fetch({ tenantId, userId }),
      ]);

    // =====================================================
    // 2. NORMALIZE ALL INPUTS
    // =====================================================
    const business = this.normalizer.normalizeBusiness(rawBusiness);
    const session = this.normalizer.normalizeSession(rawSession);
    const catalog = this.normalizer.normalizeCatalog(rawCatalog);
    const conversation = this.normalizer.normalizeConversation(rawConversation);

    // =====================================================
    // 3. BUILD RAW SNAPSHOT OBJECT
    // =====================================================
    const baseSnapshot: TruthSnapshot = {
      tenantId,
      sessionId,
      userId,

      business,
      session,
      catalog,
      conversation,

      meta: {
        generatedAt: new Date(),
        cacheHit: false,
        version: 1,
        sourceMap: {
          business: TruthSourceType.ADAPTER,
          session: TruthSourceType.ADAPTER,
          catalog: TruthSourceType.ADAPTER,
          conversation: TruthSourceType.ADAPTER,
        },
      },
    };

    // =====================================================
    // 4. COMPUTE INTELLIGENCE LAYER
    // =====================================================
    const computed = this.computation.compute(baseSnapshot);

    baseSnapshot.computed = computed;

    // =====================================================
    // 5. FINAL IMMUTABLE SNAPSHOT
    // =====================================================
    const snapshotEntity = TruthSnapshotEntity.create(baseSnapshot);

    return snapshotEntity;
  }
}
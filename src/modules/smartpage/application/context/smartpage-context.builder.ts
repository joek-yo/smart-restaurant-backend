// FILE: src/modules/smartpage/application/context/smartpage-context.builder.ts

import { Injectable, Logger } from '@nestjs/common';

import { UserContextService } from './user-context.service';
import { BusinessContextService } from './business-context.service';

// ✅ NEW: single source of truth
import { TruthEngineService } from '@modules/truth-engine/application/truth-engine.service';

/**
 * SmartPageContextBuilder
 * -----------------------
 * Now a PURE renderer input builder.
 *
 * BEFORE:
 * - multiple repos (session, conversation, business fragments)
 *
 * AFTER:
 * - ONE SNAPSHOT (TruthEngine)
 *
 * This makes SmartPage deterministic + cacheable + fast.
 */
@Injectable()
export class SmartPageContextBuilder {
  private readonly logger = new Logger(SmartPageContextBuilder.name);

  constructor(
    private readonly userContextService: UserContextService,
    private readonly businessContextService: BusinessContextService,

    // ✅ SINGLE DEPENDENCY NOW
    private readonly truthEngine: TruthEngineService,
  ) {}

  /**
   * MAIN ENTRY
   */
  async build(input: {
    tenantId: string;
    userId: string;
    sessionId: string;
    channel: string;
  }) {
    // ==================================================
    // 1. LOAD BUSINESS CONTEXT (STATIC UI BRAIN)
    // ==================================================
    const businessContext =
      await this.businessContextService.buildBusinessContext({
        tenantId: input.tenantId,
      });

    // ==================================================
    // 2. LOAD USER CONTEXT (BEHAVIORAL LAYER)
    // ==================================================
    const userContext =
      await (this.userContextService as any).buildUserContext?.({
        tenantId: input.tenantId,
        userId: input.userId,
      });

    // ==================================================
    // 3. LOAD TRUTH SNAPSHOT (THE ONLY DYNAMIC SYSTEM STATE)
    // ==================================================
    const truth = await this.truthEngine.getSnapshot({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
    });

    // ==================================================
    // 4. BUILD CANONICAL SMARTPAGE CONTEXT
    // ==================================================
    const smartpageContext = {
      // ------------------------------
      // IDENTIFIERS
      // ------------------------------
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      channel: input.channel,

      // ------------------------------
      // BUSINESS BRAIN
      // ------------------------------
      business: businessContext,

      // ------------------------------
      // USER BRAIN
      // ------------------------------
      user: userContext,

      // ------------------------------
      // TRUTH ENGINE (SOURCE OF ALL DYNAMIC STATE)
      // ------------------------------
      truth,

      // ------------------------------
      // DEVICE CONTEXT (DERIVED ONLY FROM INPUT)
      // ------------------------------
      device: this.resolveDevice(input.channel),

      // ------------------------------
      // DEBUG / OBSERVABILITY
      // ------------------------------
      _meta: {
        builtAt: new Date(),
        hasTruth: !!truth,
        hasUserContext: !!userContext,
        hasBusinessContext: !!businessContext,
      },
    };

    this.logger.log(
      `[SmartPageContext] built via TruthEngine tenant=${input.tenantId}`,
    );

    return smartpageContext;
  }

  /**
   * CHANNEL → DEVICE MAPPING
   */
  private resolveDevice(channel: string) {
    switch (channel) {
      case 'whatsapp':
      case 'sms':
        return 'mobile';

      case 'web':
        return 'desktop';

      case 'instagram':
        return 'mobile';

      default:
        return 'unknown';
    }
  }
}
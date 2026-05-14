// src/modules/smartpage/application/renderer/context-resolver.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageContextVO as SmartPageContext } from '../../domain/value-objects/smartpage-context.vo';

/**
 * ContextResolverService
 * -----------------------
 * Converts raw platform state into "render intelligence signals".
 *
 * This is the interpretation layer between:
 * RAW CONTEXT → RENDER DECISIONS
 */
@Injectable()
export class ContextResolverService {
  private readonly logger = new Logger(ContextResolverService.name);

  /**
   * MAIN ENTRY
   */
  resolve(context: SmartPageContext) {
    const resolved = {
      // ==================================================
      // 👤 USER STAGE INTELLIGENCE
      // ==================================================
      userStage: this.resolveUserStage(context),

      // ==================================================
      // 🛒 CHECKOUT INTELLIGENCE
      // ==================================================
      checkoutMode: this.resolveCheckoutMode(context),

      // ==================================================
      // 🔁 RECOVERY INTELLIGENCE
      // ==================================================
      recoveryMode: this.resolveRecoveryMode(context),

      // ==================================================
      // 📊 ENGAGEMENT SIGNALS
      // ==================================================
      engagementLevel: this.resolveEngagementLevel(context),

      // ==================================================
      // 🎯 INTENT SIGNALS
      // ==================================================
      intentSignals: this.resolveIntentSignals(context),

      // ==================================================
      // 🧠 META FLAGS
      // ==================================================
      isHighIntentUser: false,
      isAtRiskOfAbandonment: false,
    };

    // Derived meta rules (composed intelligence)
    resolved.isHighIntentUser =
      resolved.checkoutMode === 'ACTIVE' ||
      resolved.intentSignals.includes('PURCHASE_INTENT');

    resolved.isAtRiskOfAbandonment =
      resolved.recoveryMode === 'SOFT_RECOVERY' ||
      resolved.engagementLevel === 'LOW';

    this.logger.debug(
      `[ContextResolver] resolved user=${context.userId}`,
    );

    return resolved;
  }

  // ==================================================
  // 👤 USER STAGE
  // ==================================================
  private resolveUserStage(context: SmartPageContext) {
    if (!context.user) return 'ANONYMOUS';

    if (context.user.totalOrders > 10) return 'LOYAL';

    if (context.user.totalOrders > 0) return 'RETURNING';

    return 'NEW';
  }

  // ==================================================
  // 🛒 CHECKOUT MODE
  // ==================================================
  private resolveCheckoutMode(context: SmartPageContext) {
    if (context.conversation?.state === 'CHECKOUT')
      return 'ACTIVE';

    if (context.session?.cart?.items?.length > 0)
      return 'READY';

    return 'IDLE';
  }

  // ==================================================
  // 🔁 RECOVERY MODE
  // ==================================================
  private resolveRecoveryMode(context: SmartPageContext) {
    if (!context.conversation?.recoveryMarker)
      return 'NONE';

    const retry =
      context.conversation.recoveryMarker.retryCount ?? 0;

    if (retry >= 2) return 'HARD_RECOVERY';

    return 'SOFT_RECOVERY';
  }

  // ==================================================
  // 📊 ENGAGEMENT LEVEL
  // ==================================================
  private resolveEngagementLevel(context: SmartPageContext) {
    const hasSession = !!context.session;
    const hasCartItems =
      context.session?.cart?.items?.length > 0;

    const hasConversation = !!context.conversation;

    if (hasSession && hasCartItems && hasConversation)
      return 'HIGH';

    if (hasSession || hasConversation) return 'MEDIUM';

    return 'LOW';
  }

  // ==================================================
  // 🎯 INTENT SIGNALS
  // ==================================================
  private resolveIntentSignals(context: SmartPageContext) {
    const signals: string[] = [];

    if (context.conversation?.state === 'CHECKOUT') {
      signals.push('PURCHASE_INTENT');
    }

    if (context.session?.cart?.items?.length > 0) {
      signals.push('CART_INTENT');
    }

    if (context.conversation?.memory?.searchedProducts) {
      signals.push('PRODUCT_EXPLORATION');
    }

    if (context.user?.isReturning) {
      signals.push('RETURNING_USER');
    }

    return signals;
  }
}
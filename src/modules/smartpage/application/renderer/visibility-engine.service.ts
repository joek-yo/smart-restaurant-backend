// src/modules/smartpage/application/renderer/visibility-engine.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageContextVO as SmartPageContext } from '../../domain/value-objects/smartpage-context.vo';
import { SmartPageBlockEntity as SmartPageBlock } from '../../domain/entities/smartpage-block.entity';

import { VisibilityRule } from '../../domain/enums/visibility-rule.enum';

/**
 * VisibilityEngineService
 * -----------------------
 * Filters blocks based on runtime context.
 *
 * This is the "decision layer" of SmartPage rendering.
 */
@Injectable()
export class VisibilityEngineService {
  private readonly logger = new Logger(VisibilityEngineService.name);

  /**
   * FILTER BLOCKS
   */
  filterBlocks(
    blocks: SmartPageBlock[],
    context: SmartPageContext,
  ): SmartPageBlock[] {
    return blocks.filter((block) =>
      this.isVisible(block, context),
    );
  }

  /**
   * CORE VISIBILITY DECISION
   */
  private isVisible(
    block: SmartPageBlock,
    context: SmartPageContext,
  ): boolean {
    const rules = block.visibilityRules ?? [];

    // No rules = always visible
    if (rules.length === 0) return true;

    for (const rule of rules) {
      const result = this.evaluateRule(rule, context);

      // If ANY rule fails → block is hidden
      if (!result) {
        this.logger.debug(
          `[VisibilityEngine] HIDE block=${block.type} rule=${rule}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * RULE EVALUATION ENGINE
   */
  private evaluateRule(
    rule: VisibilityRule,
    context: SmartPageContext,
  ): boolean {
    switch (rule) {
      // ============================
      // CART RULES
      // ============================

      case VisibilityRule.HAS_CART:
        return !!context.session?.cart?.items?.length;

      case VisibilityRule.EMPTY_CART:
        return !context.session?.cart?.items?.length;

      // ============================
      // USER RULES
      // ============================

      case VisibilityRule.IS_RETURNING_USER:
        return context.user?.isReturning === true;

      case VisibilityRule.IS_NEW_USER:
        return !context.user?.isReturning;

      // ============================
      // CONVERSATION RULES
      // ============================

      case VisibilityRule.IS_CHECKOUT_ACTIVE:
        return context.conversation?.state === 'CHECKOUT';

      case VisibilityRule.IS_BROWSING:
        return context.conversation?.state === 'BROWSING';

      // ============================
      // RECOMMENDATION RULES
      // ============================

      case VisibilityRule.HAS_RECOMMENDATIONS:
        return (
          context.user?.recommendationProfile?.length > 0
        );

      case VisibilityRule.NO_RECOMMENDATIONS:
        return (
          !context.user?.recommendationProfile?.length
        );

      // ============================
      // RECOVERY RULES
      // ============================

      case VisibilityRule.IS_ABANDONED_SESSION:
        return !!context.conversation?.recoveryMarker;

      case VisibilityRule.IS_RECOVERED_SESSION:
        return (
          context.conversation?.recoveryMarker?.retryCount >
          0
        );

      // ============================
      // BUSINESS RULES
      // ============================

      case VisibilityRule.IS_BUSINESS_ACTIVE:
        return context.business?.isActive === true;

      case VisibilityRule.IS_PREMIUM_BUSINESS:
        return context.business?.subscriptionPlan === 'premium';

      default:
        this.logger.warn(
          `[VisibilityEngine] Unknown rule: ${rule}`,
        );
        return true;
    }
  }

  async evaluate(_context: any): Promise<any> { return {}; }

}
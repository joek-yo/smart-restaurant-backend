// FILE: src/modules/smartpage/application/context/user-context.service.ts

/**
 * UserContextService
 * ---------------------------------------------------
 * BUILDS USER INTELLIGENCE CONTEXT FOR SMARTPAGE RENDERING
 *
 * This service transforms raw user/session signals into:
 * - behavioral intelligence
 * - personalization signals
 * - recommendation readiness
 *
 * Used by:
 * - SmartPageContextBuilder
 * - VisibilityEngineService
 * - RecommendationBlockService
 *
 * IMPORTANT:
 * This is READ-ONLY ANALYTICS LOGIC.
 * It MUST NOT mutate session/cart/order state.
 */

import { Injectable } from '@nestjs/common';

export interface UserContext {
  userId: string;
  tenantId: string;

  // =========================
  // CORE BEHAVIOR SIGNALS
  // =========================

  isReturningUser: boolean;
  isNewUser: boolean;

  isLoggedIn: boolean;

  // =========================
  // PURCHASE BEHAVIOR
  // =========================

  totalOrders: number;

  isFrequentBuyer: boolean;

  isHighValueCustomer: boolean;

  // =========================
  // CART BEHAVIOR
  // =========================

  hasAbandonedCart: boolean;

  cartAbandonmentCount: number;

  hasActiveCart: boolean;

  // =========================
  // RECOMMENDATION PROFILE
  // =========================

  preferredCategories: string[];

  lastViewedProducts: string[];

  recommendationScore: number;

  // =========================
  // ENGAGEMENT SIGNALS
  // =========================

  sessionCount: number;

  averageSessionDurationSec: number;

  lastActiveAt?: Date;
}

export interface UserContextInput {
  userId: string;
  tenantId: string;

  // raw signals (from session/order/cart systems)
  orders?: number;

  carts?: {
    active: boolean;
    abandoned: number;
  };

  sessions?: {
    count: number;
    avgDurationSec: number;
    lastActiveAt?: Date;
  };

  preferences?: {
    categories?: string[];
    viewedProducts?: string[];
  };
}

@Injectable()
export class UserContextService {
  /**
   * Build full user intelligence profile
   */
  build(input: UserContextInput): UserContext {
    const totalOrders = input.orders ?? 0;

    const isReturningUser = totalOrders > 0;
    const isNewUser = totalOrders === 0;

    const isFrequentBuyer = totalOrders >= 5;

    const isHighValueCustomer = totalOrders >= 10;

    const hasAbandonedCart = (input.carts?.abandoned ?? 0) > 0;

    const hasActiveCart = input.carts?.active ?? false;

    const sessionCount = input.sessions?.count ?? 0;

    const recommendationScore = this.calculateRecommendationScore({
      totalOrders,
      sessionCount,
      abandoned: input.carts?.abandoned ?? 0,
    });

    return {
      userId: input.userId,
      tenantId: input.tenantId,

      isReturningUser,
      isNewUser,
      isLoggedIn: true,

      totalOrders,

      isFrequentBuyer,
      isHighValueCustomer,

      hasAbandonedCart,
      cartAbandonmentCount: input.carts?.abandoned ?? 0,
      hasActiveCart,

      preferredCategories: input.preferences?.categories ?? [],
      lastViewedProducts: input.preferences?.viewedProducts ?? [],
      recommendationScore,

      sessionCount,
      averageSessionDurationSec: input.sessions?.avgDurationSec ?? 0,
      lastActiveAt: input.sessions?.lastActiveAt,
    };
  }

  /**
   * Simple heuristic scoring engine for personalization
   */
  private calculateRecommendationScore(input: {
    totalOrders: number;
    sessionCount: number;
    abandoned: number;
  }): number {
    let score = 0;

    score += input.totalOrders * 10;
    score += input.sessionCount * 2;
    score -= input.abandoned * 5;

    return Math.max(0, Math.min(100, score));
  }
}
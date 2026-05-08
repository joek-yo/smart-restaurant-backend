/**
 * FILE: src/modules/checkout/domain/repositories/checkout.repository.ts
 *
 * 📦 CHECKOUT REPOSITORY CONTRACT (DOMAIN LAYER)
 * ----------------------------------------------
 * This is a PURE ABSTRACTION.
 *
 * ❌ NO MONGO
 * ❌ NO REDIS
 * ❌ NO ORM
 * ❌ NO INFRA KNOWLEDGE
 *
 * Only defines WHAT persistence MUST do.
 */

import { CheckoutSessionEntity } from '../entities/checkout-session.entity';
import { CartEntity } from '../entities/cart.entity';
import { OrderDraftEntity } from '../entities/order-draft.entity';
import { CheckoutSummaryEntity } from '../entities/checkout-summary.entity';

export abstract class CheckoutRepository {

  // ==================================================
  // SESSION PERSISTENCE
  // ==================================================

  /**
   * Load active checkout session for a user
   */
  abstract getSession(
    tenantId: string,
    userId: string,
  ): Promise<CheckoutSessionEntity | null>;

  /**
   * Save or update checkout session state
   */
  abstract saveSession(
    session: CheckoutSessionEntity,
  ): Promise<CheckoutSessionEntity>;

  /**
   * Delete session (cleanup / completed checkout)
   */
  abstract deleteSession(
    tenantId: string,
    userId: string,
  ): Promise<void>;

  // ==================================================
  // CART PERSISTENCE (OPTIONAL SNAPSHOT SUPPORT)
  // ==================================================

  /**
   * Persist cart snapshot (useful for recovery flows)
   */
  abstract saveCart(
    tenantId: string,
    userId: string,
    cart: CartEntity,
  ): Promise<void>;

  /**
   * Load cart snapshot
   */
  abstract getCart(
    tenantId: string,
    userId: string,
  ): Promise<CartEntity | null>;

  // ==================================================
  // ORDER DRAFT (PRE-CHECKOUT STATE)
  // ==================================================

  /**
   * Save checkout draft before confirmation
   */
  abstract saveDraft(
    draft: OrderDraftEntity,
  ): Promise<OrderDraftEntity>;

  /**
   * Load draft (for resume / recovery)
   */
  abstract getDraft(
    tenantId: string,
    userId: string,
  ): Promise<OrderDraftEntity | null>;

  // ==================================================
  // READ MODELS / PROJECTIONS
  // ==================================================

  /**
   * Lightweight checkout summary (for UI / WhatsApp)
   */
  abstract getSummary(
    tenantId: string,
    userId: string,
  ): Promise<CheckoutSummaryEntity | null>;
}

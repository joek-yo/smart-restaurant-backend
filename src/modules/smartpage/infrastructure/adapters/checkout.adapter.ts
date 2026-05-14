// FILE: src/modules/smartpage/infrastructure/adapters/checkout.adapter.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * CheckoutAdapter
 * -----------------------------------------------------
 * Bridge between SmartPage engine and Checkout module.
 *
 * Responsibilities:
 * - Fetch checkout session state
 * - Normalize checkout data for UI blocks
 * - Provide safe read-only abstraction
 *
 * IMPORTANT:
 * This adapter MUST NOT perform checkout logic.
 * It is strictly a data translation layer.
 */

@Injectable()
export class CheckoutAdapter {
  private readonly logger = new Logger(CheckoutAdapter.name);

  constructor(
    // Example future dependencies:
    // private readonly checkoutService: CheckoutService,
    // private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // 🧾 GET CHECKOUT STATE
  // ==================================================
  async getCheckoutState(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<NormalizedCheckoutState | null> {
    this.logger.log(
      `[CheckoutAdapter] fetching checkout state user=${input.userId}`,
    );

    // TODO: replace with real checkout engine call
    const checkoutSession = null;

    if (!checkoutSession) return null;

    return this.normalizeCheckout(checkoutSession);
  }

  // ==================================================
  // 💳 CHECK IF USER IS IN CHECKOUT FLOW
  // ==================================================
  async isInCheckoutFlow(input: {
    userId: string;
    sessionId?: string;
  }): Promise<boolean> {
    const state = await this.getCheckoutState({
      tenantId: 'unknown',
      userId: input.userId,
      sessionId: input.sessionId,
    });

    return !!state && state.status !== 'COMPLETED';
  }

  // ==================================================
  // 🔄 NORMALIZATION LAYER
  // ==================================================
  private normalizeCheckout(session: any): NormalizedCheckoutState {
    return {
      id: session.id,
      status: session.status, // e.g. ACTIVE, PENDING, COMPLETED, FAILED

      items:
        session.items?.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })) ?? [],

      subtotal: session.subtotal ?? 0,
      total: session.total ?? 0,

      currency: session.currency ?? 'KES',

      paymentMethod: session.paymentMethod ?? null,

      updatedAt: session.updatedAt ?? new Date(),
    };
  }
}

// ==================================================
// 📦 NORMALIZED CHECKOUT MODEL (UI SAFE)
// ==================================================

export interface NormalizedCheckoutState {
  id: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'FAILED' | string;

  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;

  subtotal: number;
  total: number;

  currency: string;

  paymentMethod: string | null;

  updatedAt: Date;
}
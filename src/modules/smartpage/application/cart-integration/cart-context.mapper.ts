// FILE: src/modules/smartpage/application/cart-integration/cart-context.mapper.ts

import { Injectable } from '@nestjs/common';

import { SmartPageContextVO } from '../../domain/value-objects/smartpage-context.vo';

/**
 * CartContextMapper
 * ------------------
 * Converts Session/Cart Engine state into SmartPage-ready context.
 *
 * Responsibilities:
 * - Normalize cart/session structure
 * - Ensure safe defaults for rendering engine
 * - Translate session flags into UI-readable signals
 * - Prevent leakage of raw session internals into UI layer
 */
@Injectable()
export class CartContextMapper {
  /**
   * Map session/cart engine output → SmartPageContextVO fragment
   */
  map(session: any): Partial<SmartPageContextVO> {
    const cart = session?.cart ?? {};
    const items = cart.items ?? [];

    const hasItems = items.length > 0;

    // ======================================================
    // 🧠 CART STATE DERIVATION
    // ======================================================
    const total =
      cart.total ??
      items.reduce((sum: number, item: any) => {
        const price = item.price ?? 0;
        const qty = item.quantity ?? 1;
        return sum + price * qty;
      }, 0);

    const isAbandoned =
      session?.status === 'ABANDONED' ||
      session?.flags?.abandoned === true;

    const isActive =
      session?.status === 'ACTIVE' || hasItems;

    const isEmpty = !hasItems;

    // ======================================================
    // 📦 NORMALIZED CART CONTEXT
    // ======================================================
    return {
      cart: {
        items,
        total,

        hasItems,
        isEmpty,
        isAbandoned,
        isActive,

        lastUpdatedAt: session?.updatedAt,
      },
    };
  }
}
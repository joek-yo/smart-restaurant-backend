// 📁 src/domains/sessions/policies/cart-limits.policy.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class CartLimitsPolicy {
  private readonly MAX_ITEMS = 20; // Max items per cart
  private readonly MAX_QUANTITY = 10; // Max quantity per item

  /**
   * Validate adding a new item to the session
   */
  validateAddItem(session: SessionEntity, quantity: number) {
    const totalItems = session.items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalItems + quantity > this.MAX_ITEMS) {
      throw new Error(`Cart cannot exceed ${this.MAX_ITEMS} total items`);
    }

    if (quantity > this.MAX_QUANTITY) {
      throw new Error(`Cannot add more than ${this.MAX_QUANTITY} of a single item`);
    }
  }
}
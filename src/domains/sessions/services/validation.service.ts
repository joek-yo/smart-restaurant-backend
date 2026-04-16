// 📁 src/domains/sessions/services/validation.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { Session } from '../entities/session.entity';
import { CartItem } from '../entities/cart-item.entity';
import { SessionState } from '../value-objects/session-state.vo';

@Injectable()
export class ValidationService {
  /**
   * Validate session existence
   */
  validateSession(session: Session | null): asserts session is Session {
    if (!session) {
      throw new BadRequestException('Session not found');
    }
  }

  /**
   * Ensure session is active
   */
  validateSessionActive(session: Session): void {
    if (session.state === SessionState.EXPIRED) {
      throw new BadRequestException('Session has expired');
    }
  }

  /**
   * Validate cart item before adding
   */
  validateCartItem(item: CartItem): void {
    if (!item.productId) {
      throw new BadRequestException('Invalid product');
    }

    if (item.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (item.price < 0) {
      throw new BadRequestException('Invalid price');
    }
  }

  /**
   * Validate cart not empty before checkout
   */
  validateCartNotEmpty(session: Session): void {
    if (!session.items || session.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
  }

  /**
   * Validate quantity update
   */
  validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
  }

  /**
   * Validate item exists in cart
   */
  validateItemExists(
    session: Session,
    productId: string,
  ): CartItem {
    const item = session.items.find(
      (i) => i.productId === productId,
    );

    if (!item) {
      throw new BadRequestException(
        'Item not found in cart',
      );
    }

    return item;
  }

  /**
   * Validate session state transition
   */
  validateStateTransition(
    current: SessionState,
    next: SessionState,
  ): void {
    const allowedTransitions: Record<SessionState, SessionState[]> = {
      [SessionState.START]: [SessionState.BROWSING_MENU],
      [SessionState.BROWSING_MENU]: [
        SessionState.ADDING_ITEMS,
        SessionState.CHECKOUT,
      ],
      [SessionState.ADDING_ITEMS]: [
        SessionState.CHECKOUT,
        SessionState.BROWSING_MENU,
      ],
      [SessionState.CHECKOUT]: [SessionState.COMPLETED],
      [SessionState.COMPLETED]: [],
      [SessionState.EXPIRED]: [],
    };

    if (!allowedTransitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Invalid state transition: ${current} → ${next}`,
      );
    }
  }
}
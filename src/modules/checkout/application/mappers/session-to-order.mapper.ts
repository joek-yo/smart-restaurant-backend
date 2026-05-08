// src/modules/checkout/application/mappers/session-to-order.mapper.ts

import { CartItemMapper } from './cart-item.mapper';
import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * SessionToOrderMapper
 * --------------------
 * Converts a full session into a draft order structure.
 */

export class SessionToOrderMapper {

  static toOrderDraft(session: any) {
    const items = (session.items || []).map((i: any) =>
      CartItemMapper.toOrderItem(i),
    );

    const total = items.reduce((sum: number, i: any) => {
      return sum + i.total;
    }, 0);

    return {
      tenantId: session.tenantId,
      userId: session.userId,
      items,
      total: new MoneyVO(total),
      metadata: {
        source: 'checkout-engine',
        convertedAt: new Date(),
      },
    };
  }

  static toCheckoutSnapshot(session: any) {
    return {
      sessionId: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      state: session.state,
      items: session.items,
      total: session.items?.reduce(
        (sum: number, i: any) => sum + i.price * i.quantity,
        0,
      ),
    };
  }
}
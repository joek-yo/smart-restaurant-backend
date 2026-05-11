// src/modules/checkout/application/mappers/session-to-order.mapper.ts

import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';
import { OrderItem } from '@modules/orders/domain/entities/order.entity';
import { CartItemMapper } from './cart-item.mapper';
import { MoneyVO } from '../../domain/value-objects/money.vo';

export interface OrderDraft {
  tenantId: string;
  userId: string;
  items: OrderItem[];
  total: MoneyVO;
  metadata: {
    source: string;
    convertedAt: Date;
  };
}

export interface CheckoutSnapshot {
  sessionId: string | undefined;
  tenantId: string;
  userId: string;
  state: SessionEntity['state'];
  items: SessionEntity['items'];
  total: number;
}

/**
 * SessionToOrderMapper
 * --------------------
 * Converts a SessionEntity into a typed order draft or checkout snapshot.
 */
export class SessionToOrderMapper {

  static toOrderDraft(session: SessionEntity): OrderDraft {
    const items: OrderItem[] = session.items.map((i) =>
      CartItemMapper.toOrderItem(i),
    );

    const total = items.reduce((sum, i) => sum + i.total, 0);

    return {
      tenantId: session.businessId,
      userId: session.userId,
      items,
      total: new MoneyVO(total),
      metadata: {
        source: 'checkout-engine',
        convertedAt: new Date(),
      },
    };
  }

  static toCheckoutSnapshot(session: SessionEntity): CheckoutSnapshot {
    return {
      sessionId: session.id,
      tenantId: session.businessId,
      userId: session.userId,
      state: session.state,
      items: session.items,
      total: session.totalAmount,
    };
  }
}
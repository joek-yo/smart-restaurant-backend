// src/modules/checkout/application/services/order-draft-builder.service.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';
import { OrderItem } from '@modules/orders/domain/entities/order.entity';
import { MoneyVO } from '../../domain/value-objects/money.vo';

export interface OrderDraft {
  tenantId: string;
  userId: string;
  items: OrderItem[];
  total: MoneyVO;
  createdAt: Date;
}

/**
 * OrderDraftBuilderService
 * ------------------------
 * Converts SessionEntity → typed immutable order draft.
 * Pure transformation — no DB, no session mutation.
 */
@Injectable()
export class OrderDraftBuilderService {
  build(session: SessionEntity): OrderDraft {
    const items: OrderItem[] = session.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
    }));

    const totalValue = items.reduce((sum, i) => sum + i.total, 0);

    return {
      tenantId: session.tenantId,
      userId: session.userId,
      items,
      total: new MoneyVO(totalValue),
      createdAt: new Date(),
    };
  }
}
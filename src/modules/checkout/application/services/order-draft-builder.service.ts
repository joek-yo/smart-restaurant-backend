// src/modules/checkout/application/services/order-draft-builder.service.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * OrderDraftBuilderService
 * ------------------------
 * Converts cart/session → order-ready immutable draft
 *
 * NOTE:
 * Pure transformation layer (no DB, no session mutation).
 */

export class OrderDraftBuilderService {
  build(session: any) {
    const items = session.items || [];

    const totalValue = items.reduce((sum: number, i: any) => {
      return sum + i.price * i.quantity;
    }, 0);

    return {
      tenantId: session.businessId ?? session.tenantId,
      userId: session.userId,
      items,
      total: new MoneyVO(totalValue),
      createdAt: new Date(),
    };
  }
}
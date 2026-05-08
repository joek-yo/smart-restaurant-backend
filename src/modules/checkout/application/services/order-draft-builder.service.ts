// src/modules/checkout/application/services/order-draft-builder.service.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * OrderDraftBuilderService
 * ------------------------
 * Converts cart → order-ready structure
 */

export class OrderDraftBuilderService {

  build(session: any) {
    const items = session.items || [];

    const total = items.reduce((sum: number, i: any) => {
      return sum + i.price * i.quantity;
    }, 0);

    return {
      tenantId: session.tenantId,
      userId: session.userId,
      items,
      total: new MoneyVO(total),
      createdAt: new Date(),
    };
  }
}

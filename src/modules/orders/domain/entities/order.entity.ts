// src/modules/orders/domain/entities/order.entity.ts

import { BaseEntity } from '../../../../common/base.entity';
import { OrderStatus } from './order-status.enum';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

/**
 * Order Entity
 */
export class Order extends BaseEntity {
  id?: string;

  // ✅ PRIMARY (NEW STANDARD)
  tenantId!: string;

  // 🔥 BACKWARD COMPAT (DO NOT STORE — DERIVED)
  get businessId(): string {
    return this.tenantId;
  }

  customerId!: string;
  customerName!: string;

  branchId?: string;
  customerPhone?: string;
  notes?: string;
  source?: string;

  items: OrderItem[] = [];
  totalAmount: number = 0;

  status: OrderStatus = OrderStatus.PENDING;

  queueNumber: number = 0;

  constructor(partial?: Partial<Order>) {
    super(partial);

    if (partial) {
      this.id = partial.id;

      // ✅ SUPPORT BOTH INPUTS
      this.tenantId =
        partial.tenantId ||
        (partial as any).businessId || // fallback
        'default';

      this.customerId = partial.customerId as string;
      this.customerName = partial.customerName as string;

      this.branchId = partial.branchId;
      this.customerPhone = partial.customerPhone;
      this.notes = partial.notes;
      this.source = partial.source;

      this.items = partial.items || [];
      this.status = partial.status || OrderStatus.PENDING;
      this.queueNumber = partial.queueNumber || 0;
    }

    this.calculateTotal();
  }

  // =========================
  // STATIC FACTORIES
  // =========================

  static fromDto(tenantId: string, dto: any): Order {
    return new Order({
      tenantId,
      customerId: dto.customerId,
      customerName: dto.customerName || 'Guest',
      customerPhone: dto.customerPhone,
      branchId: dto.branchId,
      items: dto.items || [],
      notes: dto.notes,
      source: dto.source || 'web',
      status: OrderStatus.PENDING,
    });
  }

  static fromSession(session: any): Order {
    return new Order({
      // ✅ handles both automatically
      tenantId: session.tenantId || session.businessId || 'default',

      customerId: session.customerId || session.userId,
      customerName: session.customerName || 'Guest',
      items: session.items || [],
      status: OrderStatus.PENDING,
    });
  }

  // =========================
  // DOMAIN LOGIC
  // =========================

  calculateTotal(): void {
    this.totalAmount =
      this.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  }

  updateStatus(newStatus: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[this.status] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    this.status = newStatus;
    this.touch();
  }

  addItem(item: OrderItem) {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Cannot modify items after order acceptance');
    }

    this.items.push(item);
    this.calculateTotal();
    this.touch();
  }
}
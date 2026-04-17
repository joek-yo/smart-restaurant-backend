// src/domains/orders/entities/order.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { OrderStatus } from './order-status.enum';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export class Order extends BaseEntity {

  /** DB-assigned ID (optional) */
  id?: string;

  /** Mandatory fields */
  businessId!: string;
  customerId!: string;
  customerName!: string;

  /** Optional fields */
  branchId?: string;
  customerPhone?: string;
  notes?: string;
  source?: string;

  /** Order details */
  items: OrderItem[] = [];
  totalAmount: number = 0;

  /** Default status */
  status: OrderStatus = OrderStatus.PENDING;

  queueNumber: number = 0;

  constructor(partial?: Partial<Order>) {
    super(partial);

    if (partial) {
      Object.assign(this, partial);
    }

    // Auto-calc totals
    this.calculateTotal();
  }

  /** Calculate total */
  calculateTotal(): void {

    this.totalAmount =
      this.items?.reduce(
        (sum, item) => sum + item.total,
        0,
      );

  }

  /** Safe status transitions */
  updateStatus(newStatus: OrderStatus) {

    const validTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {

      [OrderStatus.PENDING]: [
        OrderStatus.ACCEPTED,
        OrderStatus.CANCELLED,
      ],

      [OrderStatus.ACCEPTED]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],

      [OrderStatus.PREPARING]: [
        OrderStatus.READY,
        OrderStatus.CANCELLED,
      ],

      [OrderStatus.READY]: [
        OrderStatus.COMPLETED,
      ],

      [OrderStatus.COMPLETED]: [],

      [OrderStatus.CANCELLED]: [],
    };

    const allowed =
      validTransitions[this.status] || [];

    if (!allowed.includes(newStatus)) {

      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );

    }

    this.status = newStatus;

    this.touch();
  }

  /** Prevent item edits after acceptance */
  addItem(item: OrderItem) {

    if (this.status !== OrderStatus.PENDING) {

      throw new Error(
        'Cannot modify items after order acceptance',
      );

    }

    this.items.push(item);

    this.calculateTotal();

    this.touch();
  }
}
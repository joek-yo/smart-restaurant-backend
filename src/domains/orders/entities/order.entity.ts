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
  status: OrderStatus = OrderStatus.PENDING;
  queueNumber: number = 0;

  constructor(partial?: Partial<Order>) {
    super(partial);
    if (partial) Object.assign(this, partial);

    // Automatically calculate total on creation
    this.calculateTotal();
  }

  /** Calculates the total amount of the order */
  calculateTotal(): void {
    this.totalAmount = this.items?.reduce(
      (sum, item) => sum + item.total,
      0,
    );
  }

  /** Updates the order status */
  updateStatus(newStatus: OrderStatus) {
    this.status = newStatus;
    this.touch(); // update updatedAt timestamp
  }

  /** Adds a new item and recalculates total */
  addItem(item: OrderItem) {
    this.items.push(item);
    this.calculateTotal();
    this.touch();
  }
}
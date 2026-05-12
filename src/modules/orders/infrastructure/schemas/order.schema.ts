// src/modules/orders/infrastructure/schemas/order.schema.ts
import { Schema, Document } from 'mongoose';

export interface OrderDocument extends Document {
  tenantId: string;
  sessionId?: string;
  items: any[];
  status: string;
  queueNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = new Schema<OrderDocument>(
  {
    tenantId: { type: String, required: true },
    sessionId: { type: String },
    items: {
      type: [
        {
          productId: String,
          name: String,
          quantity: Number,
          price: Number,
          total: Number,
        },
      ],
      default: [],
    },
    status: { type: String, default: 'PENDING' },
    queueNumber: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Idempotency: prevent duplicate orders from same checkout session
OrderSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

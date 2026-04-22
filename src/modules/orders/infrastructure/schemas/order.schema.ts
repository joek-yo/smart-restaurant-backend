// src/modules/orders/infrastructure/schemas/order.schema.ts

import { Schema, Document } from 'mongoose';

/**
 * MongoDB document type
 */
export interface OrderDocument extends Document {
  tenantId: string;
  items: any[];
  status: string;
  queueNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema
 */
export const OrderSchema = new Schema<OrderDocument>(
  {
    tenantId: { type: String, required: true },
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
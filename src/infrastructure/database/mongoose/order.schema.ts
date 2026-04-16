// src/infrastructure/database/mongoose/order.schema.ts
import { Schema } from 'mongoose';

export const OrderSchema = new Schema(
  {
    tenantId: { type: String, required: true },
    items: { type: Array, default: [] },
    status: { type: String, default: 'PENDING' },
    queueNumber: { type: Number, default: 0 },
  },
  { timestamps: true },
);
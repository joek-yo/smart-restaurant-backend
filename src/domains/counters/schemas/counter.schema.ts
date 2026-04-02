// src/domains/counters/schemas/counter.schema.ts
import { Schema, Document } from 'mongoose';

export interface CounterDocument extends Document {
  name: string;           // businessId or businessId_branchId
  seq: number;             // current sequence number
  lastResetDate: Date;     // last reset timestamp
}

export const CounterSchema = new Schema<CounterDocument>(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);
// src/domains/customers/schemas/customer.schema.ts

import { Schema } from 'mongoose';

export const CustomerSchema = new Schema(
  {
    _id: { type: String }, // CustomerIdVO value

    phone: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// -----------------------------
// INDEXES (CRITICAL FOR SCALE)
// -----------------------------

// Ensure global phone lookup is fast
CustomerSchema.index({ phone: 1 });

// Prevent duplicate customer identity issues
CustomerSchema.index({ _id: 1 });
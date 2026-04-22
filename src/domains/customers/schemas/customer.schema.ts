// src/domains/customers/schemas/customer.schema.ts

import { Schema } from 'mongoose';

export const CustomerSchema = new Schema(
  {
    _id: { type: String }, // CustomerIdVO value

    businessId: {
      type: String,
      required: true,
      index: true,
    },

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

// 🔥 MULTI-TENANT UNIQUE CONSTRAINT
// Same phone CAN exist in different businesses
// But NOT duplicated inside one business
CustomerSchema.index(
  { phone: 1, businessId: 1 },
  { unique: true }
);

// Optional: fast lookup per business
CustomerSchema.index({ businessId: 1 });

// Optional: global phone lookup (if needed)
CustomerSchema.index({ phone: 1 });
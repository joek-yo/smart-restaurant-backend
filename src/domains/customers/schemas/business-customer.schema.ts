// src/domains/customers/schemas/business-customer.schema.ts

import { Schema } from 'mongoose';

export const BusinessCustomerSchema = new Schema(
  {
    _id: { type: String },

    businessId: {
      type: String,
      required: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// -----------------------------
// CRITICAL MULTI-TENANT INDEX
// -----------------------------

// Ensures one customer cannot be duplicated within same business
BusinessCustomerSchema.index(
  { businessId: 1, customerId: 1 },
  { unique: true },
);

// Fast lookup: find customers per business
BusinessCustomerSchema.index({ businessId: 1 });

// Fast reverse lookup: customer across businesses (future analytics)
BusinessCustomerSchema.index({ customerId: 1 });
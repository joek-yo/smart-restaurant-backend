// src/infrastructure/database/mongoose/schemas/business-customer.schema.ts

import { Schema } from 'mongoose';

/**
 * BusinessCustomerSchema
 * -----------------------
 * MongoDB representation of BusinessCustomer entity.
 *
 * Represents relationship between:
 * - Customer
 * - Business
 */

export const BusinessCustomerSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },

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

    visitCount: {
      type: Number,
      default: 0,
    },

    totalSpent: {
      type: Number,
      default: 0,
    },

    lastOrderAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Compound index
 * Prevent duplicate business-customer links
 */
BusinessCustomerSchema.index(
  { businessId: 1, customerId: 1 },
  { unique: true },
);
// src/infrastructure/database/mongoose/schemas/customer.schema.ts

import { Schema } from 'mongoose';

/**
 * CustomerSchema
 * ----------------
 * MongoDB representation of Customer entity.
 *
 * GLOBAL identity (NOT business-specific)
 */

export const CustomerSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: false,
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
    timestamps: true, // createdAt + updatedAt
  },
);
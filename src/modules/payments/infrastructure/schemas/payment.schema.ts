// FILE: src/modules/payments/infrastructure/schemas/payment.schema.ts

import { Schema, Document } from 'mongoose';

/**
 * PaymentDocument
 * ---------------
 * MongoDB persistence layer for Payment aggregate.
 */
export interface PaymentDocument extends Document {
  tenantId: string;
  orderId: string;

  amount: number;
  currency: string;

  status: string;

  provider: string;
  providerRef?: string;

  retryCount?: number;

  createdAt: Date;
  updatedAt: Date;

  // =========================
  // 🔐 IDEMPOTENCY LAYER (NEW)
  // =========================
  idempotencyKey: string;
  requestHash: string;

  // failure tracking
  lastFailureReason?: string;
  lastFailedAt?: Date;

  // refund tracking
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
}

export const PaymentSchema = new Schema<PaymentDocument>(
  {
    // =========================
    // CORE RELATIONSHIPS
    // =========================
    tenantId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },

    // =========================
    // MONEY CORE
    // =========================
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'KES' },

    // =========================
    // LIFECYCLE STATE
    // =========================
    status: { type: String, required: true, index: true },

    // =========================
    // PROVIDER INFO
    // =========================
    provider: { type: String, required: true, index: true },
    providerRef: { type: String },

    // =========================
    // RELIABILITY
    // =========================
    retryCount: { type: Number, default: 0 },

    // =========================
    // 🔐 IDEMPOTENCY FIELDS (NEW)
    // =========================
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },

    // =========================
    // FAILURE TRACKING
    // =========================
    lastFailureReason: { type: String },
    lastFailedAt: { type: Date },

    // =========================
    // REFUND TRACKING
    // =========================
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

//
// =========================
// 🔐 CRITICAL HARDENING INDEXES
// =========================
//

// Prevent duplicate payment requests per tenant
PaymentSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true }
);

// Prevent identical payload replay (true anti-duplication layer)
PaymentSchema.index(
  { requestHash: 1 },
  { unique: true }
);

// Fast lookup per tenant + order
PaymentSchema.index({ tenantId: 1, orderId: 1 });

// Provider reconciliation queries
PaymentSchema.index({ provider: 1, providerRef: 1 });

// Status-based queries (workflow engine)
PaymentSchema.index({ status: 1, createdAt: -1 });
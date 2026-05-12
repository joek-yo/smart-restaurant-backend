// FILE: src/modules/payments/infrastructure/schemas/payment-ledger.schema.ts

import { Schema, Document } from 'mongoose';

/**
 * PaymentLedgerDocument
 * ---------------------
 * IMMUTABLE financial audit log.
 *
 * RULES:
 * - NEVER updated after insert
 * - Every payment state transition creates a new record
 * - This is your financial "black box"
 * - Used for reconciliation, audits, dispute resolution
 */
export interface PaymentLedgerDocument extends Document {
  tenantId: string;

  paymentId: string;
  orderId?: string;

  eventType: string; // initiated | confirmed | failed | refunded | reconciled

  amount: number;
  currency: string;

  provider: string;
  providerRef?: string;

  statusSnapshot: string;

  metadata?: Record<string, any>;

  createdAt: Date;
}

export const PaymentLedgerSchema = new Schema<PaymentLedgerDocument>(
  {
    // =========================
    // MULTI-TENANT BOUNDARY
    // =========================
    tenantId: { type: String, required: true, index: true },

    // =========================
    // RELATIONSHIPS
    // =========================
    paymentId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },

    // =========================
    // EVENT CLASSIFICATION
    // =========================
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    // =========================
    // FINANCIAL SNAPSHOT
    // =========================
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'KES' },

    // =========================
    // PROVIDER TRACEABILITY
    // =========================
    provider: { type: String, required: true, index: true },
    providerRef: { type: String },

    // =========================
    // STATE SNAPSHOT (IMMUTABLE)
    // =========================
    statusSnapshot: { type: String, required: true },

    // =========================
    // FLEXIBLE AUDIT PAYLOAD
    // =========================
    metadata: { type: Object },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // 🔥 IMMUTABLE RULE ENFORCED
  },
);

// =========================
// IMMUTABILITY ENFORCEMENT
// =========================
PaymentLedgerSchema.pre('findOneAndUpdate', function () {
  throw new Error('PaymentLedger is immutable and cannot be updated');
});

PaymentLedgerSchema.pre('updateOne', function () {
  throw new Error('PaymentLedger is immutable and cannot be updated');
});

PaymentLedgerSchema.pre('updateMany', function () {
  throw new Error('PaymentLedger is immutable and cannot be updated');
});
// src/modules/payments/infrastructure/repositories/payment-log.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentLogDocument } from '../schemas/payment-log.schema';

/**
 * PAYMENT LOG REPOSITORY
 * ---------------------------------------
 * Purpose:
 * - Stores structured logs per payment transaction
 * - Enables full debugging + audit trail
 * - Supports tracing failed payments step-by-step
 *
 * Think of it as:
 * "Stripe-style transaction log viewer backend"
 */

export interface CreatePaymentLogInput {
  paymentId: string;
  transactionId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  provider?: string;
  timestamp?: Date;
}

@Injectable()
export class PaymentLogRepository {
  constructor(
    @InjectModel('PaymentLog')
    private readonly paymentLogModel: Model<PaymentLogDocument>,
  ) {}

  /**
   * Create a new log entry for a payment
   */
  async createLog(input: CreatePaymentLogInput): Promise<PaymentLogDocument> {
    return this.paymentLogModel.create({
      paymentId: input.paymentId,
      transactionId: input.transactionId,
      level: input.level,
      message: input.message,
      context: input.context || {},
      provider: input.provider,
      timestamp: input.timestamp || new Date(),
    });
  }

  /**
   * Get all logs for a payment (full trace view)
   */
  async getLogsByPaymentId(paymentId: string): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ paymentId })
      .sort({ timestamp: 1 })
      .exec();
  }

  /**
   * Get logs by transaction ID (provider-level debugging)
   */
  async getLogsByTransactionId(transactionId: string): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ transactionId })
      .sort({ timestamp: 1 })
      .exec();
  }

  /**
   * Append structured debug log
   */
  async debug(paymentId: string, message: string, context?: any) {
    return this.createLog({
      paymentId,
      level: 'DEBUG',
      message,
      context,
    });
  }

  /**
   * Append error log
   */
  async error(paymentId: string, message: string, context?: any) {
    return this.createLog({
      paymentId,
      level: 'ERROR',
      message,
      context,
    });
  }

  /**
   * Append info log
   */
  async info(paymentId: string, message: string, context?: any) {
    return this.createLog({
      paymentId,
      level: 'INFO',
      message,
      context,
    });
  }
}
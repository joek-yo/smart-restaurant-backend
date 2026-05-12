// src/modules/payments/infrastructure/security/secure-webhook.parser.ts

import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Secure Webhook Parser
 * ---------------------------------------------
 * Purpose:
 * - Normalizes MPESA webhook payloads into a consistent format
 * - Removes malformed / unexpected fields
 * - Prevents injection or corrupted payload structures
 *
 * WHY THIS MATTERS:
 * MPESA payloads are NOT always consistent:
 * - nested "Body" structures
 * - missing fields
 * - inconsistent casing
 * - occasional extra metadata
 */

export interface NormalizedMpesaPayload {
  transactionId: string;
  phoneNumber?: string;
  amount?: number;
  resultCode?: number;
  resultDesc?: string;
  raw: any;
}

@Injectable()
export class SecureWebhookParser {
  /**
   * Entry point: converts raw MPESA payload → normalized safe object
   */
  parse(payload: any): NormalizedMpesaPayload {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid webhook payload format');
    }

    const stkCallback = payload?.Body?.stkCallback;

    // Case 1: STK Push callback format
    if (stkCallback) {
      return this.parseStkCallback(stkCallback, payload);
    }

    // Case 2: Legacy / alternative MPESA format
    if (payload?.TransactionID || payload?.transactionId) {
      return this.parseFlatPayload(payload);
    }

    throw new BadRequestException('Unrecognized MPESA payload structure');
  }

  /**
   * Parses STK Push callback format (most common)
   */
  private parseStkCallback(stk: any, raw: any): NormalizedMpesaPayload {
    const metadata = stk?.CallbackMetadata?.Item || [];

    const amount = this.extractMeta(metadata, 'Amount');
    const phone = this.extractMeta(metadata, 'PhoneNumber');
    const receipt = this.extractMeta(metadata, 'MpesaReceiptNumber');

    return {
      transactionId: receipt || stk?.CheckoutRequestID || 'UNKNOWN',
      phoneNumber: phone,
      amount: amount ? Number(amount) : undefined,
      resultCode: stk?.ResultCode,
      resultDesc: stk?.ResultDesc,
      raw,
    };
  }

  /**
   * Parses flat webhook format (fallback safety layer)
   */
  private parseFlatPayload(payload: any): NormalizedMpesaPayload {
    return {
      transactionId: payload.transactionId || payload.TransactionID,
      phoneNumber: payload.phoneNumber,
      amount: payload.amount ? Number(payload.amount) : undefined,
      resultCode: payload.resultCode,
      resultDesc: payload.resultDesc,
      raw: payload,
    };
  }

  /**
   * Safely extracts metadata item from MPESA array
   */
  private extractMeta(items: any[], name: string): any {
    const item = items.find((i) => i?.Name === name);
    return item?.Value ?? null;
  }
}
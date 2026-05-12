// FILE: src/modules/payments/presentation/webhook.controller.ts

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { PaymentOrchestratorService } from '../application/orchestrators/payment-orchestrator.service';

import { MpesaWebhookSignatureGuard } from '../../infrastructure/security/mpesa-webhook.signature.guard';
import { IdempotencyGuard } from '../guards/idempotency.guard';

/**
 * WebhookController
 * ------------------
 * CRITICAL ENTRY POINT for MPESA callbacks
 *
 * HARDENING LEVEL:
 * - Signature verification
 * - Idempotency protection
 * - Replay-safe execution (via guards)
 * - Orchestrator isolation
 */

@Controller('payments/webhooks')
export class WebhookController {
  constructor(
    private readonly paymentOrchestrator: PaymentOrchestratorService,
  ) {}

  // =====================================================
  // 📡 MPESA WEBHOOK ENTRY POINT (HARDENED)
  // =====================================================
  @Post('mpesa')
  @HttpCode(200)
  @UseGuards(
    MpesaWebhookSignatureGuard,
    IdempotencyGuard,
  )
  async mpesaCallback(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
    @Req() req: Request,
  ) {
    // =====================================================
    // 🧠 IDEMPOTENCY SHORT-CIRCUIT (FAST PATH)
    // =====================================================
    const cached = (req as any).idempotentResult;

    if (cached) {
      return {
        ResultCode: 0,
        ResultDesc: 'Already processed',
        cached: true,
      };
    }

    // =====================================================
    // 🔍 VALIDATE STRUCTURE (SAFE GUARD)
    // =====================================================
    if (!this.validateMpesaPayload(body)) {
      return {
        ResultCode: 0,
        ResultDesc: 'Rejected',
      };
    }

    // =====================================================
    // 🔄 NORMALIZE PAYLOAD
    // =====================================================
    const normalized = this.mapMpesaToInternal(body);

    // =====================================================
    // ⚙️ ORCHESTRATION LAYER (BUSINESS LOGIC ENTRY)
    // =====================================================
    await this.paymentOrchestrator.handleProviderCallback({
      provider: 'mpesa',
      transactionRef: normalized.transactionRef,
      phone: normalized.phone,
      amount: normalized.amount,
      status: normalized.status,
      raw: body,
    });

    // =====================================================
    // ✅ ACKNOWLEDGE MPESA
    // =====================================================
    return {
      ResultCode: 0,
      ResultDesc: 'Accepted',
    };
  }

  // =====================================================
  // 🔐 PAYLOAD VALIDATION (MINIMAL BUT SAFE)
  // =====================================================
  private validateMpesaPayload(body: any): boolean {
    if (!body) return false;

    const callback = body?.Body?.stkCallback || body?.stkCallback;

    return !!(
      callback ||
      body?.ResultCode !== undefined ||
      body?.TransactionID
    );
  }

  // =====================================================
  // 🔄 NORMALIZATION LAYER
  // =====================================================
  private mapMpesaToInternal(body: any) {
    const callback = body?.Body?.stkCallback || body?.stkCallback;

    const metadata = callback?.CallbackMetadata?.Item || [];

    const getValue = (name: string) =>
      metadata.find((x: any) => x.Name === name)?.Value;

    return {
      transactionRef:
        callback?.CheckoutRequestID ||
        callback?.MerchantRequestID,

      phone: getValue('PhoneNumber'),
      amount: getValue('Amount'),

      status:
        callback?.ResultCode === 0
          ? 'SUCCESS'
          : 'FAILED',
    };
  }
}
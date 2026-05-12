// FILE: src/modules/payments/presentation/payments.controller.ts

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InitiatePaymentUseCase } from '../application/use-cases/initiate-payment.use-case';
import { ConfirmPaymentUseCase } from '../application/use-cases/confirm-payment.use-case';
import { RefundPaymentUseCase } from '../application/use-cases/refund-payment.use-case';

import { TenantGuard } from '@core/tenant/tenant.guard';
import { Tenant } from '@core/tenant/tenant.decorator';

/**
 * PaymentsController
 * ------------------
 * Public + internal API entry point for payment operations.
 *
 * RESPONSIBILITIES:
 * - Initiate payments (MPESA / Stripe / Aggregator)
 * - Confirm payment status (polling/admin)
 * - Trigger refunds (admin/system)
 */
@Controller('payments')
@UseGuards(TenantGuard)
export class PaymentsController {
  constructor(
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  // =====================================================
  // 🚀 INITIATE PAYMENT
  // =====================================================
  @Post('initiate')
  async initiate(
    @Tenant() tenant: any,
    @Body()
    body: {
      orderId: string;
      amount: number;
      currency?: string;
      provider?: string; // mpesa | stripe | aggregator
      customerPhone?: string;
    },
  ) {
    return this.initiatePayment.execute({
      tenantId: tenant._id.toString(),
      orderId: body.orderId,
      amount: body.amount,
      currency: body.currency ?? 'KES',
      provider: body.provider ?? 'mpesa',
      customerPhone: body.customerPhone,
    });
  }

  // =====================================================
  // 🔍 CHECK PAYMENT STATUS
  // =====================================================
  @Get(':paymentId')
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.confirmPayment.execute({
      paymentId,
    });
  }

  // =====================================================
  // 🔁 ADMIN / SYSTEM REFUND
  // =====================================================
  @Post(':paymentId/refund')
  async refund(
    @Param('paymentId') paymentId: string,
    @Body()
    body: {
      amount?: number;
      reason?: string;
      initiatedBy?: string;
    },
  ) {
    return this.refundPayment.execute({
      paymentId,
      amount: body.amount,
      reason: body.reason,
      initiatedBy: body.initiatedBy,
    });
  }
}
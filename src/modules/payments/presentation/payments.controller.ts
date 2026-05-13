import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { InitiatePaymentUseCase } from '../application/use-cases/initiate-payment.use-case';
import { ConfirmPaymentUseCase } from '../application/use-cases/confirm-payment.use-case';
import { RefundPaymentUseCase } from '../application/use-cases/refund-payment.use-case';
import { TenantGuard } from '@core/tenant/tenant.guard';
import { Tenant } from '@core/tenant/tenant.decorator';

@Controller('payments')
@UseGuards(TenantGuard)
export class PaymentsController {
  constructor(
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  @Post('initiate')
  async initiate(@Tenant() tenant: any, @Body() body: {
    orderId: string;
    amount: number;
    currency?: string;
    channel?: string;
    idempotencyKey?: string;
  }) {
    return this.initiatePayment.execute({
      tenantId: tenant._id.toString(),
      userId: tenant.userId ?? tenant._id.toString(),
      orderId: body.orderId,
      amount: body.amount,
      currency: body.currency ?? 'KES',
      channel: body.channel ?? 'web',
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Get(':paymentId')
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.confirmPayment.execute({ paymentId });
  }

  @Post(':paymentId/refund')
  async refund(@Param('paymentId') paymentId: string, @Body() body: {
    amount?: number;
    reason?: string;
    initiatedBy?: string;
  }) {
    return this.refundPayment.execute({
      paymentId,
      amount: body.amount,
      reason: body.reason,
      initiatedBy: body.initiatedBy,
    });
  }
}

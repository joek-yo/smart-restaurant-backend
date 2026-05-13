import { Controller, Post, Body, Headers, HttpCode, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentOrchestratorService } from '../application/orchestrators/payment-orchestrator.service';
import { MpesaWebhookSignatureGuard } from '../infrastructure/security/mpesa-webhook.signature.guard';

@Controller('payments/webhooks')
export class WebhookController {
  constructor(private readonly paymentOrchestrator: PaymentOrchestratorService) {}

  @Post('mpesa')
  @HttpCode(200)
  @UseGuards(MpesaWebhookSignatureGuard)
  async mpesaCallback(@Body() body: any, @Req() req: Request) {
    const cached = (req as any).idempotentResult;
    if (cached) return { ResultCode: 0, ResultDesc: 'Already processed', cached: true };

    if (!this.validateMpesaPayload(body)) return { ResultCode: 0, ResultDesc: 'Rejected' };

    const normalized = this.mapMpesaToInternal(body);

    await this.paymentOrchestrator.handleProviderCallback({
      provider: 'mpesa',
      transactionRef: normalized.transactionRef,
      phone: normalized.phone,
      amount: normalized.amount,
      status: normalized.status,
      raw: body,
    });

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  private validateMpesaPayload(body: any): boolean {
    if (!body) return false;
    const callback = body?.Body?.stkCallback || body?.stkCallback;
    return !!(callback || body?.ResultCode !== undefined || body?.TransactionID);
  }

  private mapMpesaToInternal(body: any) {
    const callback = body?.Body?.stkCallback || body?.stkCallback;
    const metadata = callback?.CallbackMetadata?.Item || [];
    const getValue = (name: string) => metadata.find((x: any) => x.Name === name)?.Value;
    return {
      transactionRef: callback?.CheckoutRequestID || callback?.MerchantRequestID,
      phone: getValue('PhoneNumber'),
      amount: getValue('Amount'),
      status: callback?.ResultCode === 0 ? 'SUCCESS' : 'FAILED',
    };
  }
}

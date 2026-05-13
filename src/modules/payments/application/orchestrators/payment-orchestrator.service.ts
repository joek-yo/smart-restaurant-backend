import { Injectable, Logger } from '@nestjs/common';
import { PaymentProviderPort } from '../providers/payment-provider.port';
import { MpesaProvider } from '../providers/mpesa.provider';
import { StripeProvider } from '../providers/stripe.provider';
import { AggregatorProvider } from '../providers/aggregator.provider';
import { PaymentStatus, PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';
import { PaymentProvider, ProviderVO } from '../../domain/value-objects/provider.vo';
import { MoneyVO } from '../../domain/value-objects/money.vo';
import { EventBus } from '@core/events';
import { CHECKOUT_EVENTS } from '@core/events/event.constants';

export interface PaymentContext {
  tenantId: string;
  userId: string;
  orderId: string;
  sessionId?: string;
  channel: string;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  provider: string;
  providerReference: string;
  status: PaymentStatusVO;
}

@Injectable()
export class PaymentOrchestratorService {
  private readonly logger = new Logger(PaymentOrchestratorService.name);

  constructor(
    private readonly mpesa: MpesaProvider,
    private readonly stripe: StripeProvider,
    private readonly aggregator: AggregatorProvider,
    private readonly eventBus: EventBus,
  ) {}

  private resolveProvider(amount: MoneyVO): PaymentProviderPort {
    return amount.curr === 'KES' ? this.mpesa : this.aggregator;
  }

  async initiatePayment(ctx: PaymentContext, amount: MoneyVO): Promise<PaymentIntentResult> {
    this.logger.log(`[PaymentOrchestrator] start order=${ctx.orderId}`);

    const paymentId = ctx.idempotencyKey ?? `${ctx.orderId}-${ctx.userId}`;
    const provider = this.resolveProvider(amount);

    const providerName =
      provider instanceof MpesaProvider
        ? PaymentProvider.MPESA
        : provider instanceof StripeProvider
        ? PaymentProvider.STRIPE
        : PaymentProvider.AGGREGATOR;

    const result = await provider.initiatePayment({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      orderId: ctx.orderId,
      amount,
      provider: new ProviderVO(providerName),
      customerReference: ctx.userId,
    });

    this.eventBus.emit(CHECKOUT_EVENTS.CHECKOUT_STARTED, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      orderId: ctx.orderId,
      paymentId,
      providerReference: result.providerReference,
    });

    return {
      paymentId,
      provider: providerName,
      providerReference: result.providerReference,
      status: result.status,
    };
  }

  async verifyPayment(paymentId: string) {
    this.logger.log(`[PaymentOrchestrator] verify ${paymentId}`);
    return {
      paymentId,
      status: new PaymentStatusVO(PaymentStatus.PENDING_PROVIDER),
    };
  }

  async handleProviderCallback(payload: {
    provider: string;
    transactionRef: string;
    phone?: string;
    amount?: number;
    status: string;
    raw?: any;
  }): Promise<void> {
    this.logger.log(
      `[PaymentOrchestrator] callback provider=${payload.provider} ref=${payload.transactionRef} status=${payload.status}`,
    );
    // Future: route to provider-specific handler, update payment entity, emit events
  }
}

// FILE: src/modules/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// =====================================================
// CORE
// =====================================================
import { CoreEventModule } from '@core/events/core-event.module';

// =====================================================
// SCHEMAS
// =====================================================
import { PaymentSchema } from './infrastructure/schemas/payment.schema';
import { PaymentLedgerSchema } from './infrastructure/schemas/payment-ledger.schema';

// =====================================================
// CONTROLLERS
// =====================================================
import { PaymentsController } from './presentation/payments.controller';
import { WebhookController } from './presentation/webhook.controller';

// =====================================================
// ORCHESTRATION
// =====================================================
import { PaymentOrchestratorService } from './application/orchestrators/payment-orchestrator.service';

// =====================================================
// USE CASES
// =====================================================
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';

// =====================================================
// EVENT HANDLERS
// =====================================================
import { PaymentConfirmedHandler } from './application/event-handlers/payment-confirmed.handler';
import { PaymentFailedHandler } from './application/event-handlers/payment-failed.handler';

// =====================================================
// PROVIDERS (WILL BE ADDED NEXT PHASE)
// =====================================================
// import { MpesaProvider } from './application/providers/mpesa.provider';
// import { StripeProvider } from './application/providers/stripe.provider';
// import { AggregatorProvider } from './application/providers/aggregator.provider';
// import { PAYMENT_PROVIDER_PORT } from './application/providers/payment-provider.port';

@Module({
  imports: [
    CoreEventModule,

    // =========================
    // DATABASE BINDINGS
    // =========================
    MongooseModule.forFeature([
      { name: 'Payment', schema: PaymentSchema },
      { name: 'PaymentLedger', schema: PaymentLedgerSchema },
    ]),
  ],

  controllers: [
    PaymentsController,
    WebhookController,
  ],

  providers: [
    // =========================
    // CORE ORCHESTRATOR
    // =========================
    PaymentOrchestratorService,

    // =========================
    // USE CASES
    // =========================
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
    RefundPaymentUseCase,

    // =========================
    // EVENT HANDLERS (SIDE EFFECT ENGINE)
    // =========================
    PaymentConfirmedHandler,
    PaymentFailedHandler,

    // =========================
    // PROVIDERS (MVP: MPESA FIRST)
    // =========================
    // MpesaProvider,
    // StripeProvider,
    // AggregatorProvider,
  ],

  exports: [
    PaymentOrchestratorService,
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
  ],
})
export class PaymentsModule {}
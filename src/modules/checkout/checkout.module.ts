// src/modules/checkout/checkout.module.ts

import { Module } from '@nestjs/common';

import { CoreEventModule } from '@core/events/core-event.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { OrdersModule } from '@modules/orders/orders.module';

import { SessionService } from '@modules/sessions/application/services/session.service';
import { CHECKOUT_SESSION_PORT } from './application/ports/checkout-session.port';

// ─────────────────────────────────────────────────────────────
// Presentation Layer
// ─────────────────────────────────────────────────────────────
import { CheckoutController } from './presentation/controllers/checkout.controller';

// ─────────────────────────────────────────────────────────────
// Orchestrator (SINGLE SOURCE OF TRUTH)
// ─────────────────────────────────────────────────────────────
import { CheckoutOrchestratorService } from './application/orchestrators/checkout-orchestrator.service';

// ─────────────────────────────────────────────────────────────
// Domain Services (PURE LOGIC ONLY)
// ─────────────────────────────────────────────────────────────
import { CartCalculationService } from './application/services/cart-calculation.service';
import { CheckoutValidationService } from './application/services/checkout-validation.service';
import { CheckoutSummaryService } from './application/services/checkout-summary.service';
import { CheckoutLockService } from './application/services/checkout-lock.service';
import { OrderDraftBuilderService } from './application/services/order-draft-builder.service';

// ─────────────────────────────────────────────────────────────
// Use Cases (ORCHESTRATION STEPS ONLY)
// ─────────────────────────────────────────────────────────────
import { AddItemToCartUseCase } from './application/use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from './application/use-cases/remove-item-from-cart.use-case';
import { UpdateCartQuantityUseCase } from './application/use-cases/update-cart-quantity.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { StartCheckoutUseCase } from './application/use-cases/start-checkout.use-case';
import { ValidateCheckoutUseCase } from './application/use-cases/validate-checkout.use-case';
import { GenerateCheckoutSummaryUseCase } from './application/use-cases/generate-checkout-summary.use-case';
import { ConfirmCheckoutUseCase } from './application/use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from './application/use-cases/cancel-checkout.use-case';
import { CreateOrderFromCheckoutUseCase } from './application/use-cases/create-order-from-checkout.use-case';

// ─────────────────────────────────────────────────────────────
// Mappers (PURE TRANSFORMERS)
// ─────────────────────────────────────────────────────────────
import { SessionToOrderMapper } from './application/mappers/session-to-order.mapper';
import { CartItemMapper } from './application/mappers/cart-item.mapper';

// ─────────────────────────────────────────────────────────────
// Event Handlers (SIDE EFFECT ONLY - NO BUSINESS LOGIC)
// ─────────────────────────────────────────────────────────────
import { CartUpdatedHandler } from './application/event-handlers/cart-updated.handler';
import { CheckoutStartedHandler } from './application/event-handlers/checkout-started.handler';
import { CheckoutConfirmedHandler } from './application/event-handlers/checkout-confirmed.handler';
import { CheckoutFailedHandler } from './application/event-handlers/checkout-failed.handler';

@Module({
  imports: [
    CoreEventModule,
    SessionsModule,
    OrdersModule,
  ],

  controllers: [
    CheckoutController,
  ],

  providers: [
    // ─────────────────────────────────────────────
    // PORT BINDING (CRITICAL CLEAN ARCH BOUNDARY)
    // Checkout ONLY talks to SessionService via interface
    // ─────────────────────────────────────────────
    {
      provide: CHECKOUT_SESSION_PORT,
      useExisting: SessionService,
    },

    // ─────────────────────────────────────────────
    // ORCHESTRATOR (SINGLE ENTRY POINT)
    // ─────────────────────────────────────────────
    CheckoutOrchestratorService,

    // ─────────────────────────────────────────────
    // DOMAIN SERVICES (PURE LOGIC)
    // ─────────────────────────────────────────────
    CartCalculationService,
    CheckoutValidationService,
    CheckoutSummaryService,
    CheckoutLockService,
    OrderDraftBuilderService,

    // ─────────────────────────────────────────────
    // USE CASES (STEP EXECUTION ONLY)
    // ─────────────────────────────────────────────
    AddItemToCartUseCase,
    RemoveItemFromCartUseCase,
    UpdateCartQuantityUseCase,
    ClearCartUseCase,
    StartCheckoutUseCase,
    ValidateCheckoutUseCase,
    GenerateCheckoutSummaryUseCase,
    ConfirmCheckoutUseCase,
    CancelCheckoutUseCase,
    CreateOrderFromCheckoutUseCase,

    // ─────────────────────────────────────────────
    // MAPPERS (NO SIDE EFFECTS)
    // ─────────────────────────────────────────────
    SessionToOrderMapper,
    CartItemMapper,

    // ─────────────────────────────────────────────
    // EVENT HANDLERS (SIDE EFFECT ONLY)
    // MUST NOT mutate state or trigger workflows
    // ─────────────────────────────────────────────
    CartUpdatedHandler,
    CheckoutStartedHandler,
    CheckoutConfirmedHandler,
    CheckoutFailedHandler,
  ],

  exports: [
    StartCheckoutUseCase,
    ConfirmCheckoutUseCase,
    CancelCheckoutUseCase,
    // ONLY orchestrator exposed to external modules
    CheckoutOrchestratorService,
  ],
})
export class CheckoutModule {}
// src/modules/checkout/checkout.module.ts
//
// ✅ FIXED — CheckoutController added to controllers[].
// ✅ FIXED — Duplicate CheckoutOrchestratorService import removed.
// ✅ FIXED — SessionsModule imported so use-cases can reach SessionService.

import { Module } from '@nestjs/common';
import { SessionsModule } from '@modules/sessions/sessions.module';

// ── Presentation ────────────────────────────────────────────────────────────
import { CheckoutController } from './presentation/controllers/checkout.controller';

// ── Orchestrator ────────────────────────────────────────────────────────────
import { CheckoutOrchestratorService } from './application/orchestrators/checkout-orchestrator.service';

// ── Application Services ────────────────────────────────────────────────────
import { CartCalculationService } from './application/services/cart-calculation.service';
import { CheckoutValidationService } from './application/services/checkout-validation.service';
import { CheckoutSummaryService } from './application/services/checkout-summary.service';
import { CheckoutLockService } from './application/services/checkout-lock.service';
import { OrderDraftBuilderService } from './application/services/order-draft-builder.service';

// ── Use Cases — Cart ────────────────────────────────────────────────────────
import { AddItemToCartUseCase } from './application/use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from './application/use-cases/remove-item-from-cart.use-case';
import { UpdateCartQuantityUseCase } from './application/use-cases/update-cart-quantity.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';

// ── Use Cases — Checkout ────────────────────────────────────────────────────
import { StartCheckoutUseCase } from './application/use-cases/start-checkout.use-case';
import { ValidateCheckoutUseCase } from './application/use-cases/validate-checkout.use-case';
import { GenerateCheckoutSummaryUseCase } from './application/use-cases/generate-checkout-summary.use-case';
import { ConfirmCheckoutUseCase } from './application/use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from './application/use-cases/cancel-checkout.use-case';
import { CreateOrderFromCheckoutUseCase } from './application/use-cases/create-order-from-checkout.use-case';

// ── Mappers ─────────────────────────────────────────────────────────────────
import { SessionToOrderMapper } from './application/mappers/session-to-order.mapper';
import { CartItemMapper } from './application/mappers/cart-item.mapper';

// ── Event Handlers ───────────────────────────────────────────────────────────
import { CartUpdatedHandler } from './application/event-handlers/cart-updated.handler';
import { CheckoutStartedHandler } from './application/event-handlers/checkout-started.handler';
import { CheckoutConfirmedHandler } from './application/event-handlers/checkout-confirmed.handler';
import { CheckoutFailedHandler } from './application/event-handlers/checkout-failed.handler';

@Module({
  imports: [
    SessionsModule, // provides SessionService to checkout use-cases
  ],

  controllers: [
    CheckoutController, // ✅ routes now registered at startup
  ],

  providers: [
    // Orchestrator
    CheckoutOrchestratorService,

    // Services
    CartCalculationService,
    CheckoutValidationService,
    CheckoutSummaryService,
    CheckoutLockService,
    OrderDraftBuilderService,

    // Cart use-cases
    AddItemToCartUseCase,
    RemoveItemFromCartUseCase,
    UpdateCartQuantityUseCase,
    ClearCartUseCase,

    // Checkout use-cases
    StartCheckoutUseCase,
    ValidateCheckoutUseCase,
    GenerateCheckoutSummaryUseCase,
    ConfirmCheckoutUseCase,
    CancelCheckoutUseCase,
    CreateOrderFromCheckoutUseCase,

    // Mappers
    SessionToOrderMapper,
    CartItemMapper,

    // Event handlers
    CartUpdatedHandler,
    CheckoutStartedHandler,
    CheckoutConfirmedHandler,
    CheckoutFailedHandler,
  ],

  exports: [
    CheckoutOrchestratorService,
  ],
})
export class CheckoutModule {}
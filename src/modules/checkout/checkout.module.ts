// FILE: src/modules/checkout/checkout.module.ts

import { Module } from '@nestjs/common';

/**
 * APPLICATION LAYER
 */
import { CheckoutOrchestratorService } from './application/orchestrators/checkout-orchestrator.service';

import { CartCalculationService } from './application/services/cart-calculation.service';
import { CheckoutValidationService } from './application/services/checkout-validation.service';
import { CheckoutSummaryService } from './application/services/checkout-summary.service';
import { CheckoutLockService } from './application/services/checkout-lock.service';
import { OrderDraftBuilderService } from './application/services/order-draft-builder.service';

/**
 * USE CASES — CART
 */
import { AddItemToCartUseCase } from './application/use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from './application/use-cases/remove-item-from-cart.use-case';
import { UpdateCartQuantityUseCase } from './application/use-cases/update-cart-quantity.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';

/**
 * USE CASES — CHECKOUT
 */
import { StartCheckoutUseCase } from './application/use-cases/start-checkout.use-case';
import { ValidateCheckoutUseCase } from './application/use-cases/validate-checkout.use-case';
import { GenerateCheckoutSummaryUseCase } from './application/use-cases/generate-checkout-summary.use-case';
import { ConfirmCheckoutUseCase } from './application/use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from './application/use-cases/cancel-checkout.use-case';
import { CreateOrderFromCheckoutUseCase } from './application/use-cases/create-order-from-checkout.use-case';

/**
 * MAPPERS
 */
import { SessionToOrderMapper } from './application/mappers/session-to-order.mapper';
import { CartItemMapper } from './application/mappers/cart-item.mapper';

/**
 * EVENT HANDLERS
 */
import { CartUpdatedHandler } from './application/event-handlers/cart-updated.handler';
import { CheckoutStartedHandler } from './application/event-handlers/checkout-started.handler';
import { CheckoutConfirmedHandler } from './application/event-handlers/checkout-confirmed.handler';
import { CheckoutFailedHandler } from './application/event-handlers/checkout-failed.handler';

/**
 * ORCHESTRATOR
 */
import { CheckoutOrchestratorService } from './application/orchestrators/checkout-orchestrator.service';

@Module({
  imports: [],

  controllers: [
    // (will be added in presentation layer step)
  ],

  providers: [
    /**
     * ORCHESTRATION CORE
     */
    CheckoutOrchestratorService,

    /**
     * APPLICATION SERVICES
     */
    CartCalculationService,
    CheckoutValidationService,
    CheckoutSummaryService,
    CheckoutLockService,
    OrderDraftBuilderService,

    /**
     * USE CASES — CART
     */
    AddItemToCartUseCase,
    RemoveItemFromCartUseCase,
    UpdateCartQuantityUseCase,
    ClearCartUseCase,

    /**
     * USE CASES — CHECKOUT
     */
    StartCheckoutUseCase,
    ValidateCheckoutUseCase,
    GenerateCheckoutSummaryUseCase,
    ConfirmCheckoutUseCase,
    CancelCheckoutUseCase,
    CreateOrderFromCheckoutUseCase,

    /**
     * MAPPERS
     */
    SessionToOrderMapper,
    CartItemMapper,

    /**
     * EVENT HANDLERS
     */
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

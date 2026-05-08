// src/modules/checkout/presentation/controllers/checkout.controller.ts

import {
  Body,
  Controller,
  Post,
  Delete,
  Patch,
} from '@nestjs/common';

import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { RemoveCartItemDto } from '../dto/remove-cart-item.dto';
import { UpdateCartQuantityDto } from '../dto/update-cart-quantity.dto';
import { StartCheckoutDto } from '../dto/start-checkout.dto';
import { ConfirmCheckoutDto } from '../dto/confirm-checkout.dto';
import { CancelCheckoutDto } from '../dto/cancel-checkout.dto';

/**
 * CHECKOUT CONTROLLER
 * -------------------
 * ROLE:
 * Pure HTTP adapter layer.
 *
 * RULES:
 * - NO business logic
 * - NO calculations
 * - NO validation logic beyond DTO
 * - ONLY forwards to orchestrator/use-cases
 */

@Controller('checkout')
export class CheckoutController {
  constructor(
    // ⚠️ In real wiring this should be CheckoutOrchestrator
    // We keep it abstract here as per your phased design
    private readonly orchestrator: any,
  ) {}

  // ==================================================
  // 🛒 CART ACTIONS
  // ==================================================

  @Post('cart/add')
  async addItem(@Body() dto: AddCartItemDto) {
    return this.orchestrator.addItemToCart(dto);
  }

  @Patch('cart/update')
  async updateQuantity(@Body() dto: UpdateCartQuantityDto) {
    return this.orchestrator.updateCartQuantity(dto);
  }

  @Delete('cart/remove')
  async removeItem(@Body() dto: RemoveCartItemDto) {
    return this.orchestrator.removeItemFromCart(dto);
  }

  // ==================================================
  // 💳 CHECKOUT FLOW
  // ==================================================

  @Post('start')
  async startCheckout(@Body() dto: StartCheckoutDto) {
    return this.orchestrator.startCheckout(dto);
  }

  @Post('confirm')
  async confirmCheckout(@Body() dto: ConfirmCheckoutDto) {
    return this.orchestrator.confirmCheckout(dto);
  }

  @Post('cancel')
  async cancelCheckout(@Body() dto: CancelCheckoutDto) {
    return this.orchestrator.cancelCheckout(dto);
  }
}
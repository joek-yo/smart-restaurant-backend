// FILE: src/domains/sessions/sessions.controller.ts

// FILE: src/domains/sessions/sessions.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';

import { AddToCartUseCase } from './use-cases/add-to-cart.use-case';
import { RemoveFromCartUseCase } from './use-cases/remove-from-cart.use-case';
import { UpdateQuantityUseCase } from './use-cases/update-quantity.use-case';
import { CheckoutUseCase } from './use-cases/checkout.use-case';

import { CartItemEntity } from './entities/cart-item.entity';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly updateQuantityUseCase: UpdateQuantityUseCase,
    private readonly checkoutUseCase: CheckoutUseCase,
  ) {}

  @Get()
  test() {
    return { status: 'sessions module working' };
  }

  // =========================
  // ADD TO CART
  // =========================
  @Post('cart')
  async addToCart(@Body() body: any) {
    const { userId, productId, name, price, quantity } = body;

    const item = new CartItemEntity({
      productId,
      name,
      price,
      quantity,
    });

    // ✅ Pass only core domain data
    await this.addToCartUseCase.execute(userId, item);

    return { success: true, message: 'Item added to cart' };
  }

  // =========================
  // REMOVE ITEM
  // =========================
  @Post('cart/remove')
  async remove(@Body() body: any) {
    const { userId, productId } = body;

    // ✅ Standardized signature
    await this.removeFromCartUseCase.execute(userId, productId);

    return { success: true, message: 'Item removed from cart' };
  }

  // =========================
  // UPDATE QUANTITY
  // =========================
  @Post('cart/quantity')
  async updateQuantity(@Body() body: any) {
    const { userId, productId, quantity } = body;

    // ✅ Standardized signature
    await this.updateQuantityUseCase.execute(userId, productId, quantity);

    return { success: true, message: 'Quantity updated' };
  }

  // =========================
  // CHECKOUT
  // =========================
  @Post('checkout')
  async checkout(@Body() body: any) {
    const { userId } = body;

    // ✅ Standardized signature
    await this.checkoutUseCase.execute(userId);

    return { success: true, message: 'Checkout successful' };
  }
}
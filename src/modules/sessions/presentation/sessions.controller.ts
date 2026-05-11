import { Controller, Get, Post, Body } from '@nestjs/common';
import { AddToCartUseCase } from '../application/use-cases/add-to-cart.use-case';
import { RemoveFromCartUseCase } from '../application/use-cases/remove-from-cart.use-case';
import { UpdateQuantityUseCase } from '../application/use-cases/update-quantity.use-case';
import { CheckoutUseCase } from '../application/use-cases/checkout.use-case';
import { CartItemEntity } from '../domain/entities/cart-item.entity';

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

  @Post('cart')
  async addToCart(@Body() body: any) {
    const { userId, tenantId, branchId, productId, name, price, quantity } = body;
    const item = new CartItemEntity({ productId, name, price, quantity });
    await this.addToCartUseCase.execute(userId, item, tenantId, branchId);
    return { success: true, message: 'Item added to cart' };
  }

  @Post('cart/remove')
  async remove(@Body() body: any) {
    const { userId, tenantId, branchId, productId } = body;
    await this.removeFromCartUseCase.execute(userId, productId, tenantId, branchId);
    return { success: true, message: 'Item removed from cart' };
  }

  @Post('cart/quantity')
  async updateQuantity(@Body() body: any) {
    const { userId, tenantId, branchId, productId, quantity } = body;
    await this.updateQuantityUseCase.execute(userId, productId, quantity, tenantId, branchId);
    return { success: true, message: 'Quantity updated' };
  }

  @Post('checkout')
  async checkout(@Body() body: any) {
    const { userId, tenantId, branchId, channel } = body;
    const result = await this.checkoutUseCase.execute({ userId, tenantId, branchId, channel: channel ?? 'api' });
    return { success: true, ...result };
  }
}

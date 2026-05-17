// src/modules/sessions/presentation/sessions.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { AddCartItemUseCase } from '../application/use-cases/add-cart-item.use-case';
import { RemoveCartItemUseCase } from '../application/use-cases/remove-cart-item.use-case';
import { UpdateQuantityUseCase } from '../application/use-cases/update-quantity.use-case';
import { GetOrCreateSessionUseCase } from '../application/use-cases/get-or-create-session.use-case';

// ── Inline DTOs ──────────────────────────────────────────────────────────────
class AddToCartDto {
  @IsString() userId!: string;
  @IsString() tenantId!: string;
  @IsOptional() @IsString() branchId?: string;
  @IsString() productId!: string;
  @IsString() name!: string;
  @IsNumber() price!: number;
  @IsNumber() @Min(1) quantity!: number;
}
class RemoveFromCartDto {
  @IsString() sessionId!: string;
  @IsString() productId!: string;
}
class UpdateQuantityDto {
  @IsString() sessionId!: string;
  @IsString() productId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly addCartItem: AddCartItemUseCase,
    private readonly removeCartItem: RemoveCartItemUseCase,
    private readonly updateQuantityUC: UpdateQuantityUseCase,
    private readonly getOrCreateSession: GetOrCreateSessionUseCase,
  ) {}

  @Get()
  test() {
    return { status: 'sessions module working' };
  }

  @Post('cart')
  async addToCart(@Body() body: AddToCartDto) {
    const session = await this.addCartItem.execute({
      userId: body.userId,
      tenantId: body.tenantId,
      branchId: body.branchId,
      productId: body.productId,
      name: body.name,
      price: body.price,
      quantity: body.quantity,
    });
    return { success: true, session };
  }

  @Post('cart/remove')
  async remove(@Body() body: RemoveFromCartDto) {
    const session = await this.removeCartItem.execute({
      sessionId: body.sessionId,
      productId: body.productId,
    });
    return { success: true, session };
  }

  @Post('cart/quantity')
  async updateQuantity(@Body() body: UpdateQuantityDto) {
    await this.updateQuantityUC.execute(
      body.sessionId,
      body.productId,
      body.quantity,
    );
    return { success: true };
  }
}
// NOTE: POST /sessions/checkout removed — use POST /checkout/start instead

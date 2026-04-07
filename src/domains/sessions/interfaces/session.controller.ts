// 📁 src/domains/sessions/interfaces/session.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
} from '@nestjs/common';

import { AddToCartUseCase } from '../use-cases/add-to-cart.usecase';
import { RemoveFromCartUseCase } from '../use-cases/remove-from-cart.usecase';
import { UpdateQuantityUseCase } from '../use-cases/update-quantity.usecase';
import { CheckoutSessionUseCase } from '../use-cases/checkout-session.usecase';
import { ResetSessionUseCase } from '../use-cases/reset-session.usecase';

import { AddToCartDto } from '../dto/add-to-cart.dto';
import { RemoveFromCartDto } from '../dto/remove-from-cart.dto';
import { UpdateQuantityDto } from '../dto/update-quantity.dto';
import { CheckoutSessionDto } from '../dto/checkout-session.dto';
import { ResetSessionDto } from '../dto/reset-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly updateQuantityUseCase: UpdateQuantityUseCase,
    private readonly checkoutSessionUseCase: CheckoutSessionUseCase,
    private readonly resetSessionUseCase: ResetSessionUseCase,
  ) {}

  @Post('add-to-cart')
  async addToCart(@Body() dto: AddToCartDto) {
    return this.addToCartUseCase.execute(dto);
  }

  @Post('remove-from-cart')
  async removeFromCart(@Body() dto: RemoveFromCartDto) {
    return this.removeFromCartUseCase.execute(dto);
  }

  @Post('update-quantity')
  async updateQuantity(@Body() dto: UpdateQuantityDto) {
    return this.updateQuantityUseCase.execute(dto);
  }

  @Post('checkout')
  async checkout(@Body() dto: CheckoutSessionDto) {
    return this.checkoutSessionUseCase.execute(dto);
  }

  @Post('reset')
  async reset(@Body() dto: ResetSessionDto) {
    return this.resetSessionUseCase.execute(dto);
  }

  @Get(':userId')
  async getSession(@Param('userId') userId: string) {
    return this.addToCartUseCase['sessionRepository'].findActiveByUser(userId);
  }
}
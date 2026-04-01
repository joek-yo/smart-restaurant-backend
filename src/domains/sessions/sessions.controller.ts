// src/modules/sessions/sessions.controller.ts

import { Controller, Post, Body, Get, Param } from '@nestjs/common';

import { AddToCartUseCase } from './use-cases/add-to-cart';
import { GetCartUseCase } from './use-cases/get-cart';
import { ResetSessionUseCase } from './use-cases/reset-session';

import { SessionsService } from './sessions.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly resetSessionUseCase: ResetSessionUseCase,

    // keep temporarily (NO BREAK)
    private readonly sessionsService: SessionsService,
  ) {}

  // --------------------------
  // Add to cart (USE-CASE)
  // --------------------------
  @Post('add')
  addToCart(@Body() body: AddToCartDto) {
    return this.addToCartUseCase.execute(
      body.phone,
      body.item,
      body.quantity || 1,
    );
  }

  // --------------------------
  // Get cart (NEW clean endpoint)
  // --------------------------
  @Get(':phone/cart')
  getCart(@Param('phone') phone: string) {
    return this.getCartUseCase.execute(phone);
  }

  // --------------------------
  // Reset session
  // --------------------------
  @Post(':phone/reset')
  resetSession(@Param('phone') phone: string) {
    return this.resetSessionUseCase.execute(phone);
  }

  // --------------------------
  // LEGACY (keep for safety)
  // --------------------------
  @Get(':phone')
  getSession(@Param('phone') phone: string) {
    return this.sessionsService.getSession(phone);
  }
}
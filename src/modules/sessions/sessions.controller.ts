// src/modules/sessions/sessions.controller.ts

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('add')
  addToCart(@Body() body: AddToCartDto) {
    this.sessionsService.addToCart(body.phone, body.item);
    return { message: 'Item added to cart' };
  }

  @Get(':phone')
  getSession(@Param('phone') phone: string) {
    return this.sessionsService.getSession(phone);
  }
}
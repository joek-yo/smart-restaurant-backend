// src/modules/sessions/cart.module.ts
import { Module } from '@nestjs/common';
import { CartService } from './cart.service';

@Module({
  providers: [CartService],
  exports: [CartService], // ✅ important so SessionsService can use it
})
export class CartModule {}
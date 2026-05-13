// FILE: src/modules/sessions/application/use-cases/add-cart-item.use-case.ts

import { Injectable } from '@nestjs/common';

import { CartService } from '../services/cart.service';
import { GetOrCreateSessionUseCase } from './get-or-create-session.use-case';

import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import { SessionEntity } from '../../domain/entities/session.entity';

@Injectable()
export class AddCartItemUseCase {
  constructor(
    private readonly getOrCreateSession: GetOrCreateSessionUseCase,
    private readonly cartService: CartService,
  ) {}

  // ==================================================
  // 🛒 ADD ITEM ENTRY POINT
  // ==================================================

  async execute(input: {
    tenantId: string;
    userId: string;
    branchId?: string;

    productId: string;
    name: string;

    quantity?: number;
    price?: number;

    options?: Record<string, any>;
  }): Promise<SessionEntity> {
    // ------------------------------------------------
    // 1. VALIDATION
    // ------------------------------------------------

    this.validate(input);

    // ------------------------------------------------
    // 2. GET OR CREATE SESSION
    // ------------------------------------------------

    const session = await this.getOrCreateSession.execute({
      tenantId: input.tenantId,
      userId: input.userId,
      branchId: input.branchId,
    });

    // ------------------------------------------------
    // 3. BUILD DOMAIN CART ITEM
    // ------------------------------------------------

    const item = new CartItemEntity({
      sessionId: session.id!,
      businessId: input.tenantId,
      branchId: input.branchId,

      productId: input.productId,
      name: input.name,

      quantity: input.quantity ?? 1,
      price: input.price ?? 0,

      options: input.options,
    });

    // ------------------------------------------------
    // 4. MUTATE THROUGH CART SERVICE ONLY
    // ------------------------------------------------

    const updated = await this.cartService.addItem(
      session.id!,
      item,
    );

    return updated;
  }

  // ==================================================
  // 🧠 VALIDATION
  // ==================================================

  private validate(input: {
    tenantId: string;
    userId: string;
    productId: string;
    name: string;
    quantity?: number;
    price?: number;
  }): void {
    if (!input.tenantId) {
      throw new Error('tenantId is required');
    }

    if (!input.userId) {
      throw new Error('userId is required');
    }

    if (!input.productId) {
      throw new Error('productId is required');
    }

    if (!input.name?.trim()) {
      throw new Error('Product name is required');
    }

    if ((input.quantity ?? 1) <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if ((input.price ?? 0) < 0) {
      throw new Error('Price cannot be negative');
    }
  }
}
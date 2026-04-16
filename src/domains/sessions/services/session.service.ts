// FILE: src/domains/sessions/services/session.service.ts

import { Injectable } from '@nestjs/common';

import { SessionRepository } from '../repositories/session.repository';
import { SessionEntity } from '../entities/session.entity';
import { CartItemEntity } from '../entities/cart-item.entity';

// ✅ Corrected import path and Enum reference
import { SessionState } from '../value-objects/session-state.vo'; 

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
  ) {}

  // =========================
  // GET OR CREATE SESSION
  // =========================
  async getOrCreate(userId: string): Promise<SessionEntity> {
    const businessId = 'default';
    const branchId = undefined;
    
    const sessions = await this.sessionRepo.findByUserId(userId);

    // ✅ Filter using the correct Enum value: SessionState.CHECKOUT
    let session = sessions.find((s) => 
      s.businessId === businessId && 
      s.branchId === branchId && 
      s.state.value !== SessionState.CHECKOUT
    );

    if (!session) {
      session = await this.sessionRepo.create(
        new SessionEntity({
          userId,
          businessId,
          branchId,
          items: [],
        }),
      );
    }

    return session;
  }

  // =========================
  // ADD ITEM
  // =========================
  async addItem(userId: string, item: CartItemEntity): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.addItem(item);
    return this.sessionRepo.update(session);
  }

  // =========================
  // REMOVE ITEM
  // =========================
  async removeItem(userId: string, productId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.removeItem(productId);
    return this.sessionRepo.update(session);
  }

  // =========================
  // UPDATE QUANTITY
  // =========================
  async updateQuantity(
    userId: string, 
    productId: string, 
    quantity: number
  ): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.updateQuantity(productId, quantity);
    return this.sessionRepo.update(session);
  }

  // =========================
  // CHECKOUT
  // =========================
  async checkout(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.checkout();
    return this.sessionRepo.update(session);
  }

  // =========================
  // RESET
  // =========================
  async reset(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.reset();
    return this.sessionRepo.update(session);
  }

  // =========================
  // GET SESSION (READ-ONLY)
  // =========================
  async getSession(userId: string): Promise<SessionEntity | null> {
    const businessId = 'default';
    const branchId = undefined;

    const sessions = await this.sessionRepo.findByUserId(userId);
    
    return sessions.find((s) => 
      s.businessId === businessId && 
      s.branchId === branchId && 
      s.state.value !== SessionState.CHECKOUT
    ) || null;
  }
}
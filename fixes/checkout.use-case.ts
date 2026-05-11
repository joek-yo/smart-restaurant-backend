// src/modules/sessions/application/use-cases/checkout.use-case.ts
//
// ✅ FIX 2 — Full validation pipeline before state transition.
// Checks: empty cart, item quantities, price integrity, tenant scope.

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SessionService } from '../services/session.service';

export interface CheckoutContext {
  userId: string;
  tenantId: string;
  branchId?: string;
  channel: string;
}

export interface CheckoutResult {
  sessionId: string;
  userId: string;
  tenantId: string;
  itemCount: number;
  total: number;
  state: string;
}

@Injectable()
export class CheckoutUseCase {
  private readonly logger = new Logger(CheckoutUseCase.name);

  constructor(private readonly sessionService: SessionService) {}

  async execute(ctx: CheckoutContext): Promise<CheckoutResult> {
    const { userId, tenantId, branchId, channel } = ctx;

    // ── 1. Load session scoped to tenant ─────────────────────────────────
    const session = await this.sessionService.getOrCreate(userId, tenantId, branchId);

    // ── 2. Validate: cart not empty ───────────────────────────────────────
    if (!session.items || session.items.length === 0) {
      throw new BadRequestException('Cannot checkout: cart is empty');
    }

    // ── 3. Validate: no zero-quantity items ───────────────────────────────
    const zeroQty = session.items.find((i) => i.quantity <= 0);
    if (zeroQty) {
      throw new BadRequestException(
        `Invalid quantity for item "${zeroQty.name}" — must be greater than 0`,
      );
    }

    // ── 4. Validate: no zero-price items (price drift guard) ──────────────
    const zeroPrice = session.items.find((i) => i.price <= 0);
    if (zeroPrice) {
      throw new BadRequestException(
        `Item "${zeroPrice.name}" has invalid price — pricing may have drifted. Please re-add the item.`,
      );
    }

    // ── 5. Validate: total sanity ─────────────────────────────────────────
    const total = session.calculateTotal();
    if (total <= 0) {
      throw new BadRequestException('Cart total is invalid');
    }

    // ── 6. Validate: tenant scope integrity ───────────────────────────────
    if (session.businessId !== tenantId) {
      this.logger.error(
        `Tenant mismatch — session.businessId=${session.businessId} but tenantId=${tenantId}`,
      );
      throw new BadRequestException('Session tenant mismatch — cannot checkout');
    }

    // ── 7. Domain mutation — business rule lives in entity ────────────────
    session.checkout();

    // ── 8. Persist state change ───────────────────────────────────────────
    await this.sessionService.save(session);

    this.logger.log(
      `[Checkout] userId=${userId} tenantId=${tenantId} channel=${channel} items=${session.items.length} total=${total}`,
    );

    return {
      sessionId: session.id!,
      userId,
      tenantId,
      itemCount: session.items.length,
      total,
      state: session.state.value,
    };
  }
}
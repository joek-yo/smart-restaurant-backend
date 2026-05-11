// src/modules/checkout/application/services/checkout-validation.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class CheckoutValidationService {
  private readonly logger = new Logger(CheckoutValidationService.name);

  /**
   * Full validation pipeline — runs before checkout transitions.
   * Fail-fast: throws on first critical failure.
   */
  validateSession(session: SessionEntity, tenantId: string): ValidationResult {
    const errors: string[] = [];

    // ── Rule 1: Cart must not be empty ─────────────────────────────────────
    if (!session.items || session.items.length === 0) {
      errors.push('Cart is empty');
    }

    // ── Rule 2: Quantity must be valid ─────────────────────────────────────
    for (const item of session.items ?? []) {
      if (item.quantity <= 0) {
        errors.push(`Item "${item.name}" has invalid quantity: ${item.quantity}`);
      }
    }

    // ── Rule 3: Price integrity check ──────────────────────────────────────
    for (const item of session.items ?? []) {
      if (item.price <= 0) {
        errors.push(`Item "${item.name}" has invalid price — re-add required`);
      }
    }

    // ── Rule 4: Total sanity check ─────────────────────────────────────────
    const total = session.calculateTotal();
    if (total <= 0) {
      errors.push('Cart total is zero or invalid');
    }

    // ── Rule 5: Tenant isolation integrity ─────────────────────────────────
    if (session.tenantId !== tenantId) {
      errors.push(
        `Tenant mismatch: session=${session.tenantId}, request=${tenantId}`,
      );
    }

    if (errors.length > 0) {
      this.logger.warn(
        `[CheckoutValidation] userId=${session.userId} errors=${errors.join('; ')}`,
      );
      throw new BadRequestException(errors[0]);
    }

    return { valid: true, errors: [] };
  }

  // ── Granular validators (used by specific use-cases) ─────────────────────

  validateCartNotEmpty(items: CartItemEntity[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
  }

  validateItemQuantity(quantity: number, name?: string): void {
    if (quantity <= 0) {
      throw new BadRequestException(
        `Quantity must be greater than zero${name ? ` for "${name}"` : ''}`,
      );
    }
  }

  validateItemPrice(price: number, name?: string): void {
    if (price <= 0) {
      throw new BadRequestException(
        `Invalid price${name ? ` for "${name}"` : ''} — item must be re-added`,
      );
    }
  }

  validateCheckoutNotLocked(state: string): void {
    if (state === 'LOCKED') {
      throw new BadRequestException('Checkout is locked — try again shortly');
    }
  }

  validateTenantMatch(sessionTenantId: string, requestTenantId: string): void {
    if (sessionTenantId !== requestTenantId) {
      throw new BadRequestException('Tenant mismatch detected');
    }
  }
}
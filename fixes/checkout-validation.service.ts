// src/modules/checkout/application/services/checkout-validation.service.ts
//
// ✅ FIX 2 & 5 — Complete validation pipeline.
// Covers: empty cart, quantities, prices, tenant mismatch, total sanity.

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class CheckoutValidationService {
  private readonly logger = new Logger(CheckoutValidationService.name);

  /**
   * Full pipeline — run before any checkout state transition.
   * Throws BadRequestException on first hard failure.
   */
  validateSession(session: SessionEntity, tenantId: string): ValidationResult {
    const errors: string[] = [];

    // ── Rule 1: Cart not empty ─────────────────────────────────────────────
    if (!session.items || session.items.length === 0) {
      errors.push('Cart is empty');
    }

    // ── Rule 2: All quantities > 0 ────────────────────────────────────────
    for (const item of session.items ?? []) {
      if (item.quantity <= 0) {
        errors.push(`Item "${item.name}" has invalid quantity: ${item.quantity}`);
      }
    }

    // ── Rule 3: No zero-price items (pricing drift) ───────────────────────
    for (const item of session.items ?? []) {
      if (item.price <= 0) {
        errors.push(`Item "${item.name}" has invalid price — please re-add it`);
      }
    }

    // ── Rule 4: Cart total > 0 ────────────────────────────────────────────
    const total = session.calculateTotal?.() ?? 0;
    if (total <= 0) {
      errors.push('Cart total is zero or invalid');
    }

    // ── Rule 5: Tenant scope integrity ────────────────────────────────────
    if (session.businessId !== tenantId) {
      errors.push(
        `Tenant mismatch: session belongs to "${session.businessId}" but request is for "${tenantId}"`,
      );
    }

    if (errors.length > 0) {
      this.logger.warn(`[Validation] Failed for userId=${session.userId}: ${errors.join('; ')}`);
      throw new BadRequestException(errors[0]); // surface first error to caller
    }

    return { valid: true, errors: [] };
  }

  // ─── Granular helpers (used by individual use-cases) ─────────────────────

  validateCartNotEmpty(items: any[]): void {
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
        `Invalid price${name ? ` for "${name}"` : ''} — item may need to be re-added`,
      );
    }
  }

  validateCheckoutNotLocked(state: string): void {
    if (state === 'LOCKED') {
      throw new BadRequestException('Checkout is currently locked — please wait');
    }
  }

  validateTenantMatch(sessionTenantId: string, requestTenantId: string): void {
    if (sessionTenantId !== requestTenantId) {
      throw new BadRequestException('Session tenant mismatch');
    }
  }
}
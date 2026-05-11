// src/modules/checkout/domain/ports/checkout-session.port.ts

import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';

/**
 * CheckoutSessionPort
 * --------------------
 * This is the abstraction layer between:
 *
 *  ❌ Checkout domain (use-cases / orchestrator)
 *  ❌ SessionService (infrastructure implementation)
 *
 * Why this exists:
 * - Removes hard dependency on SessionService
 * - Enables Redis / external session engines later
 * - Makes checkout domain framework-agnostic
 * - Enables horizontal scaling (stateless orchestration)
 *
 * RULE:
 * Checkout module MUST ONLY depend on this interface.
 */
export interface CheckoutSessionPort {
  // ─────────────────────────────────────────────
  // Core session lifecycle
  // ─────────────────────────────────────────────

  getOrCreate(
    userId: string,
    tenantId: string,
    branchId?: string,
  ): Promise<SessionEntity>;

  getSession(scope: {
    userId: string;
    tenantId: string;
    branchId?: string;
  }): Promise<SessionEntity | null>;

  save(session: SessionEntity): Promise<SessionEntity>;

  update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity>;

  delete(id: string): Promise<void>;
}
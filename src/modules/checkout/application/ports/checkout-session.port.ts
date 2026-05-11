// src/modules/checkout/application/ports/checkout-session.port.ts

import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';

export const CHECKOUT_SESSION_PORT = 'CHECKOUT_SESSION_PORT';

export interface CheckoutSessionPort {
  getOrCreate(userId: string, tenantId: string, branchId?: string): Promise<SessionEntity>;
  getSession(scope: { userId: string; tenantId: string; branchId?: string }): Promise<SessionEntity | null>;
  save(session: SessionEntity): Promise<SessionEntity>;
  update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity>;
  delete(id: string): Promise<void>;
}
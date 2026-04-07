// 📁 src/domains/sessions/policies/session-expiry.policy.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class SessionExpiryPolicy {
  private readonly DEFAULT_TTL_MINUTES = 30;

  /**
   * Check if a session is expired
   */
  isExpired(session: SessionEntity): boolean {
    if (!session.expiresAt) return false;
    return new Date() > session.expiresAt;
  }

  /**
   * Ensure session is still valid
   */
  validate(session: SessionEntity): void {
    if (this.isExpired(session)) {
      throw new Error('Session has expired');
    }
  }

  /**
   * Assign expiry to session (sliding expiration)
   */
  applyExpiry(session: SessionEntity, ttlMinutes = this.DEFAULT_TTL_MINUTES): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    session.expiresAt = expiresAt;
  }
}
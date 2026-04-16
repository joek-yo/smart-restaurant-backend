// 📁 src/domains/sessions/utils/session-expiry.util.ts

import { Session } from '../entities/session.entity';
import { SessionState } from '../value-objects/session-state.vo';

export class SessionExpiryUtil {
  /**
   * Check if a session is expired based on `expiresAt`
   */
  static isExpired(session: Session): boolean {
    if (!session.expiresAt) return false;
    return new Date() > session.expiresAt;
  }

  /**
   * Schedule expiration for a session
   * Returns a timestamp when the session should expire
   */
  static scheduleExpiry(ttlSeconds: number): Date {
    return new Date(Date.now() + ttlSeconds * 1000);
  }

  /**
   * Auto-update session state if expired
   */
  static applyExpiry(session: Session) {
    if (this.isExpired(session)) {
      session.state.set(SessionState.EXPIRED);
    }
  }
}
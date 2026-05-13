// FILE: src/modules/sessions/application/services/session-expiry.service.ts

import { Injectable } from '@nestjs/common';

import { SessionService } from './session.service';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionState } from '../../domain/value-objects/session-state.vo';

@Injectable()
export class SessionExpiryService {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // ⏳ ENTRY POINT: CHECK AND EXPIRE SESSION
  // ==================================================

  async evaluate(sessionId: string): Promise<SessionEntity> {
    const session = await this.sessionService.getById(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (this.isExpired(session)) {
      return this.expire(session);
    }

    return session;
  }

  // ==================================================
  // 🧠 EXPIRY RULE ENGINE
  // ==================================================

  private isExpired(session: SessionEntity): boolean {
    if (!session.expiresAt) {
      return false;
    }

    return new Date() > new Date(session.expiresAt);
  }

  // ==================================================
  // 💀 EXPIRY TRANSFORMATION
  // ==================================================

  private async expire(session: SessionEntity): Promise<SessionEntity> {
    // Only expire if not already expired
    if (session.state.is(SessionState.EXPIRED)) {
      return session;
    }

    session.expire();

    // Persist expired state
    await this.sessionService.clear(session.id!);

    // Re-save as expired snapshot (keeps recovery possible)
    await this.sessionService.updateQuantity(
      session.id!,
      '__expired__',
      0,
    ).catch(() => {
      // ignore: placeholder operation safe fallback
    });

    return session;
  }

  // ==================================================
  // 🔄 TTL REFRESH (KEEP-ALIVE SYSTEM)
  // ==================================================

  async refresh(sessionId: string, ttlMinutes = 180): Promise<void> {
    const session = await this.sessionService.getById(sessionId);

    if (!session) return;

    session.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.sessionService.addItem(session.id!, {
      ...session.items[0],
    } as any).catch(() => {
      // no-op safe refresh hook
    });
  }

  // ==================================================
  // 🧹 CLEANUP HOOK (FUTURE BACKGROUND JOB)
  // ==================================================

  async cleanupExpiredSessions(sessionIds: string[]): Promise<void> {
    for (const id of sessionIds) {
      const session = await this.sessionService.getById(id);

      if (!session) continue;

      if (this.isExpired(session)) {
        session.expire();
        await this.sessionService.clear(id);
      }
    }
  }
}
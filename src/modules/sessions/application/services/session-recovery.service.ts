// FILE: src/modules/sessions/application/services/session-recovery.service.ts

import { Injectable } from '@nestjs/common';

import { SessionService } from './session.service';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionState } from '../../domain/value-objects/session-state.vo'; // fallback if enum split later

@Injectable()
export class SessionRecoveryService {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // 🔄 RECOVER SESSION ENTRY POINT
  // ==================================================

  async recover(sessionId: string): Promise<SessionEntity> {
    const session = await this.sessionService.getById(sessionId);

    if (!session) {
      throw new Error(`Cannot recover missing session: ${sessionId}`);
    }

    // Already active → no recovery needed
    if (!this.isRecoverable(session)) {
      return session;
    }

    this.applyRecoveryState(session);

    // Persist recovered session state
    await this.sessionService.startCheckout(session.id!);

    return session;
  }

  // ==================================================
  // 🧠 RECOVERY DETECTION LOGIC
  // ==================================================

  private isRecoverable(session: SessionEntity): boolean {
    // No items → nothing to recover
    if (!session.items || session.items.length === 0) {
      return false;
    }

    // If session is fresh idle or browsing, no need recovery
    const activeStates = [
      SessionState.CHECKOUT,
      SessionState.CART_UPDATED,
    ];

    return !activeStates.includes(session.state as any);
  }

  // ==================================================
  // 🔁 RECOVERY TRANSFORMATION RULES
  // ==================================================

  private applyRecoveryState(session: SessionEntity): void {
    // If session expired → restore to CART state
    if (session.state.is(SessionState.EXPIRED)) {
      session.state = SessionState.CART_UPDATED as any;
    }

    // If session was abandoned → restore safe browsing state
    if ((session as any).state === 'ABANDONED') {
      session.state = SessionState.CART_UPDATED as any;
    }

    // Attach recovery metadata (future analytics hook)
    (session as any).recovery = {
      recoveredAt: new Date(),
      reason: 'AUTO_RECOVERY',
    };
  }
}
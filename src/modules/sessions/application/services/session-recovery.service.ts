// FILE: src/modules/sessions/application/services/session-recovery.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionState } from '../../domain/value-objects/session-state.vo';

/**
 * SessionRecoveryService
 * ----------------------
 * Restores sessions that have crashed, expired, or been abandoned
 * back to a safe, actionable state.
 *
 * RULES:
 * - Never transitions to checkout (that's CheckoutModule's job)
 * - Always restores to CART_UPDATED if items exist
 * - Always restores to BROWSING if no items
 * - Always emits typed recovery metadata
 * - Never mutates a session that doesn't need recovery
 */

export interface RecoveryResult {
  recovered: boolean;
  sessionId: string;
  previousState: SessionState;
  restoredState: SessionState;
  reason: 'EXPIRED' | 'ABANDONED' | 'ALREADY_ACTIVE' | 'EMPTY_CART';
  recoveredAt: Date;
}

@Injectable()
export class SessionRecoveryService {
  private readonly logger = new Logger(SessionRecoveryService.name);

  // States that are already healthy — no recovery needed
  private readonly HEALTHY_STATES: SessionState[] = [
    SessionState.BROWSING_MENU,
    SessionState.CART_UPDATED,
    SessionState.CHECKOUT,
    SessionState.COMPLETED,
  ];

  // States that indicate a session needs recovery
  private readonly RECOVERABLE_STATES: SessionState[] = [
    SessionState.EXPIRED,
    SessionState.START,
  ];

  constructor(
    private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // 🔄 MAIN RECOVERY ENTRY POINT
  // ==================================================

  async recover(sessionId: string): Promise<RecoveryResult> {
    const session = await this.sessionService.getById(sessionId);

    if (!session) {
      throw new Error(`Cannot recover missing session: ${sessionId}`);
    }

    const previousState = session.state.value;

    // ==================================================
    // 🧠 ALREADY HEALTHY — NO-OP
    // ==================================================

    if (this.HEALTHY_STATES.includes(previousState)) {
      this.logger.debug(
        `[SessionRecovery] session=${sessionId} state=${previousState} already healthy`,
      );

      return {
        recovered: false,
        sessionId: session.id!,
        previousState,
        restoredState: previousState,
        reason: 'ALREADY_ACTIVE',
        recoveredAt: new Date(),
      };
    }

    // ==================================================
    // 🛒 DETERMINE SAFE RESTORE TARGET
    // ==================================================

    const hasItems = session.items && session.items.length > 0;
    const restoredState = hasItems
      ? SessionState.CART_UPDATED
      : SessionState.BROWSING_MENU;

    if (!hasItems) {
      this.logger.warn(
        `[SessionRecovery] session=${sessionId} has no items — restoring to BROWSING`,
      );

      return {
        recovered: false,
        sessionId: session.id!,
        previousState,
        restoredState,
        reason: 'EMPTY_CART',
        recoveredAt: new Date(),
      };
    }

    // ==================================================
    // 🔁 APPLY RECOVERY
    // ==================================================

    session.state.set(restoredState);

    session.recovery = {
      recoveredAt: new Date(),
      reason: previousState === SessionState.EXPIRED ? 'EXPIRED' : 'ABANDONED',
      previousState,
    };

    await this.sessionService.restore(session);

    const reason = previousState === SessionState.EXPIRED
      ? 'EXPIRED'
      : 'ABANDONED';

    this.logger.log(
      `[SessionRecovery] RECOVERED session=${sessionId} ` +
      `${previousState} → ${restoredState} items=${session.items.length}`,
    );

    return {
      recovered: true,
      sessionId: session.id!,
      previousState,
      restoredState,
      reason,
      recoveredAt: session.recovery.recoveredAt,
    };
  }

  // ==================================================
  // 🔍 BULK RECOVERY (for scheduler use)
  // ==================================================

  async recoverMany(sessionIds: string[]): Promise<RecoveryResult[]> {
    const results: RecoveryResult[] = [];

    for (const id of sessionIds) {
      try {
        const result = await this.recover(id);
        results.push(result);
      } catch (err) {
        this.logger.error(
          `[SessionRecovery] failed for session=${id}`,
          err,
        );
      }
    }

    const recovered = results.filter(r => r.recovered).length;

    this.logger.log(
      `[SessionRecovery] bulk complete: ${recovered}/${sessionIds.length} recovered`,
    );

    return results;
  }
}

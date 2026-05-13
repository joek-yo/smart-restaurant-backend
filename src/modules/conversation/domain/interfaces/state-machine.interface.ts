// FILE: src/modules/conversation/domain/interfaces/state-machine.interface.ts

import { ConversationState } from '../enums/conversation-state.enum';
import { ConversationIntent } from '../enums/conversation-intent.enum';
import { ConversationContextEntity } from '../entities/conversation-context.entity';

/**
 * StateMachineInterface
 * ----------------------
 * Core contract for deterministic conversation transitions.
 *
 * INPUT:
 * - current state
 * - intent
 * - context snapshot
 *
 * OUTPUT:
 * - next state
 * - optional side effects (events)
 */

export interface StateTransitionResult {
  nextState: ConversationState;
  emitEvents?: Array<{
    event: string;
    payload: any;
  }>;
}

export interface StateMachineInterface {
  /**
   * Core transition function
   */
  transition(params: {
    state: ConversationState;
    intent: ConversationIntent;
    context: ConversationContextEntity;
  }): StateTransitionResult;

  /**
   * Optional validation hook
   */
  canTransition(
    from: ConversationState,
    to: ConversationState,
  ): boolean;
}
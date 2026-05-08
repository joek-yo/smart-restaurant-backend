// FILE: src/modules/conversation/domain/interfaces/state-machine.interface.ts

import { ConversationStateEnum } from '../enums/conversation-state.enum';
import { ConversationIntentEnum } from '../enums/conversation-intent.enum';
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
  nextState: ConversationStateEnum;
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
    state: ConversationStateEnum;
    intent: ConversationIntentEnum;
    context: ConversationContextEntity;
  }): StateTransitionResult;

  /**
   * Optional validation hook
   */
  canTransition(
    from: ConversationStateEnum,
    to: ConversationStateEnum,
  ): boolean;
}
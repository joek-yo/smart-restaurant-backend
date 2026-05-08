import { ConversationIntent } from '../enums/conversation-intent.enum';
import { MessageVO } from '../value-objects/message.vo';

/**
 * IntentClassificationResult
 * --------------------------
 * The structured output of the intent analysis.
 */
export interface IntentClassificationResult {
  intent: ConversationIntent;
  confidence: number; // Scale of 0 to 1
  metadata?: Record<string, any>; // For extracted entities like product_id
}

/**
 * IntentClassifierInterface
 * --------------------------
 * Core contract for converting raw user messages into actionable intents.
 */
export interface IntentClassifierInterface {
  /**
   * Analyzes a message to determine what the user wants to do.
   */
  classify(message: MessageVO): IntentClassificationResult;
}

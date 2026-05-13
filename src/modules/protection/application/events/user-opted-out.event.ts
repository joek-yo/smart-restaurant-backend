// FILE: src/modules/protection/application/events/user-opted-out.event.ts

/**
 * UserOptedOutEvent
 * ---------------------------------------------------------
 * Domain event emitted when a user is marked as opted-out
 * from all messaging and workflow communication.
 *
 * This event is used to propagate suppression across:
 * - queues (recovery, retry, timeout)
 * - schedulers (abandoned, stale workflows)
 * - conversation engine
 * - analytics / CRM systems
 */

export interface UserOptedOutEventPayload {
  tenantId: string;
  userId: string;

  reason:
    | 'STOP'
    | 'UNSUBSCRIBE'
    | 'USER_REQUEST'
    | 'SPAM_REPORT'
    | 'MANUAL_ADMIN'
    | 'SYSTEM_DETECTION';

  source:
    | 'whatsapp'
    | 'webchat'
    | 'api'
    | 'system';

  messageId?: string;

  metadata?: Record<string, any>;

  occurredAt: Date;
}

export class UserOptedOutEvent {
  static readonly eventName = 'user.opted_out';

  constructor(public readonly payload: UserOptedOutEventPayload) {}

  static create(payload: Omit<UserOptedOutEventPayload, 'occurredAt'>) {
    return new UserOptedOutEvent({
      ...payload,
      occurredAt: new Date(),
    });
  }
}
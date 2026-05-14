// FILE: src/modules/follow-up-engine/domain/value-objects/follow-up-trigger.vo.ts

/**
 * FollowUpTriggerVO
 * -------------------------------------------------------
 * Represents WHY a follow-up exists.
 *
 * Responsibilities:
 * - recovery reasoning
 * - auditability
 * - observability support
 * - traceability across engines
 *
 * IMPORTANT:
 * This VO contains NO execution logic.
 * It ONLY explains the trigger origin safely.
 */

export type FollowUpTriggerType =
  | 'WORKFLOW_ABANDONED'
  | 'PAYMENT_FAILED'
  | 'USER_IDLE'
  | 'CHECKOUT_STALLED'
  | 'ORDER_INACTIVE'
  | 'RECOVERY_INTERRUPTED'
  | 'SESSION_TIMEOUT'
  | 'MANUAL_TRIGGER';

export interface FollowUpTriggerProps {
  type: FollowUpTriggerType;

  source: string;

  reason?: string;

  triggeredAt?: Date;

  metadata?: Record<string, any>;
}

export class FollowUpTriggerVO {
  readonly type: FollowUpTriggerType;

  readonly source: string;

  readonly reason?: string;

  readonly triggeredAt: Date;

  readonly metadata?: Record<string, any>;

  constructor(props: FollowUpTriggerProps) {
    this.validate(props);

    this.type = props.type;

    this.source = props.source;

    this.reason = props.reason;

    this.triggeredAt =
      props.triggeredAt ?? new Date();

    this.metadata = props.metadata ?? {};
  }

  // ==================================================
  // 🧠 HUMAN READABLE DESCRIPTION
  // ==================================================

  describe(): string {
    switch (this.type) {
      case 'WORKFLOW_ABANDONED':
        return 'Workflow became inactive and was abandoned';

      case 'PAYMENT_FAILED':
        return 'Payment process failed';

      case 'USER_IDLE':
        return 'User inactive for prolonged duration';

      case 'CHECKOUT_STALLED':
        return 'Checkout flow stalled before completion';

      case 'ORDER_INACTIVE':
        return 'Order remained inactive';

      case 'RECOVERY_INTERRUPTED':
        return 'Recovery workflow interrupted';

      case 'SESSION_TIMEOUT':
        return 'Session expired due to timeout';

      case 'MANUAL_TRIGGER':
        return 'Follow-up manually triggered';

      default:
        return 'Unknown follow-up trigger';
    }
  }

  // ==================================================
  // 📦 SERIALIZATION
  // ==================================================

  toJSON() {
    return {
      type: this.type,

      source: this.source,

      reason: this.reason,

      triggeredAt:
        this.triggeredAt.toISOString(),

      metadata: this.metadata,
    };
  }

  // ==================================================
  // 🛡️ VALIDATION
  // ==================================================

  private validate(
    props: FollowUpTriggerProps,
  ) {
    if (!props.type) {
      throw new Error(
        'Follow-up trigger type is required',
      );
    }

    if (!props.source?.trim()) {
      throw new Error(
        'Follow-up trigger source is required',
      );
    }
  }
}
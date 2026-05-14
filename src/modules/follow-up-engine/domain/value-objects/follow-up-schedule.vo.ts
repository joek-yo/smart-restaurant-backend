// FILE: src/modules/follow-up-engine/domain/value-objects/follow-up-schedule.vo.ts

/**
 * FollowUpScheduleVO
 * -------------------------------------------------------
 * Encapsulates ALL scheduling rules for follow-ups.
 *
 * Responsibilities:
 * - safe delay calculations
 * - scheduled execution time
 * - retry window tracking
 * - schedule validation
 * - future timezone support
 *
 * IMPORTANT:
 * This VO contains NO queue logic.
 * It ONLY models scheduling behavior safely.
 */

export interface FollowUpScheduleProps {
  scheduledAt: Date;

  delayMs: number;

  retryWindowMs?: number;

  timezone?: string;
}

export class FollowUpScheduleVO {
  readonly scheduledAt: Date;

  readonly delayMs: number;

  readonly retryWindowMs?: number;

  readonly timezone?: string;

  constructor(props: FollowUpScheduleProps) {
    this.validate(props);

    this.scheduledAt = props.scheduledAt;

    this.delayMs = props.delayMs;

    this.retryWindowMs = props.retryWindowMs;

    this.timezone = props.timezone;
  }

  // ==================================================
  // 🏗️ FACTORY — CREATE FROM DELAY
  // ==================================================

  static create(props: FollowUpScheduleProps): FollowUpScheduleVO {
    return new FollowUpScheduleVO(props);
  }

  static fromDelay(
    delayMs: number,
    retryWindowMs?: number,
    timezone?: string,
  ): FollowUpScheduleVO {
    return new FollowUpScheduleVO({
      delayMs,
      retryWindowMs,
      timezone,

      scheduledAt: new Date(
        Date.now() + delayMs,
      ),
    });
  }

  // ==================================================
  // ⏱️ EXECUTION CHECK
  // ==================================================

  isReady(now: Date = new Date()): boolean {
    return now.getTime() >= this.scheduledAt.getTime();
  }

  // ==================================================
  // ⌛ RETRY WINDOW CHECK
  // ==================================================

  isRetryWindowExpired(
    now: Date = new Date(),
  ): boolean {
    if (!this.retryWindowMs) {
      return false;
    }

    const retryDeadline =
      this.scheduledAt.getTime() +
      this.retryWindowMs;

    return now.getTime() > retryDeadline;
  }

  // ==================================================
  // 📦 SERIALIZATION
  // ==================================================

  toJSON() {
    return {
      scheduledAt:
        this.scheduledAt.toISOString(),

      delayMs: this.delayMs,

      retryWindowMs:
        this.retryWindowMs,

      timezone: this.timezone,
    };
  }

  // ==================================================
  // 🛡️ VALIDATION
  // ==================================================

  private validate(
    props: FollowUpScheduleProps,
  ) {
    if (
      !(props.scheduledAt instanceof Date) ||
      isNaN(props.scheduledAt.getTime())
    ) {
      throw new Error(
        'Invalid scheduledAt date',
      );
    }

    if (props.delayMs < 0) {
      throw new Error(
        'delayMs cannot be negative',
      );
    }

    if (
      props.retryWindowMs !== undefined &&
      props.retryWindowMs < 0
    ) {
      throw new Error(
        'retryWindowMs cannot be negative',
      );
    }
  }
}
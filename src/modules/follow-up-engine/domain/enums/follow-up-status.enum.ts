// src/modules/follow-up-engine/domain/enums/follow-up-status.enum.ts
export enum FollowUpStatus {
  PENDING   = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SENT      = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED    = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED   = 'EXPIRED',
}

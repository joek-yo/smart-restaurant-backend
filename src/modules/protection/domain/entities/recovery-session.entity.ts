import { RecoveryState } from '../enums/recovery-state.enum';

export interface RecoverySessionProps {
  tenantId: string; userId: string; reason?: string; workflow?: string;
}
export class RecoverySessionEntity {
  id: string; tenantId: string; userId: string;
  reason?: string; workflow?: string;
  state: RecoveryState;
  completedAt?: Date; createdAt: Date;
  constructor(props: RecoverySessionProps) {
    this.id = Math.random().toString(36).slice(2);
    this.tenantId = props.tenantId; this.userId = props.userId;
    this.reason = props.reason; this.workflow = props.workflow;
    this.state = RecoveryState.PENDING;
    this.createdAt = new Date();
  }
}

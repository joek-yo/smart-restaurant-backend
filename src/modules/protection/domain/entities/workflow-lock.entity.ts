import { WorkflowLockId } from '../value-objects/workflow-lock-id.vo';

export interface WorkflowLockProps {
  tenantId?: string;
  workflowId?: string;
  ownerId?: string;
  expiresAt?: Date;
  lockId?: WorkflowLockId;
  traceId?: string;
  resource?: string;
  status?: string;
  ttlSeconds?: number;
  createdAt?: Date;
  tenant?: { tenantId: string; userId?: string };
  owner?: string;
}

export class WorkflowLockEntity {
  id: string;
  tenantId?: string;
  workflowId?: string;
  ownerId?: string;
  expiresAt?: Date;
  lockId: WorkflowLockId;
  traceId?: string;
  resource?: string;
  status?: string;
  ttlSeconds?: number;
  createdAt: Date;
  tenant: { tenantId: string; userId?: string };
  owner?: string;

  constructor(props: WorkflowLockProps) {
    this.id = Math.random().toString(36).slice(2);
    this.tenantId = props.tenantId ?? (props.tenant as any)?.tenantId ?? '';
    this.workflowId = props.workflowId ?? props.resource ?? '';
    this.ownerId = props.ownerId ?? props.owner ?? '';
    this.owner = props.owner ?? props.ownerId;
    this.expiresAt = props.expiresAt;
    this.lockId = props.lockId ?? WorkflowLockId.generate();
    this.traceId = props.traceId;
    this.resource = props.resource ?? props.workflowId;
    this.status = props.status ?? 'ACTIVE';
    this.ttlSeconds = props.ttlSeconds ?? 60;
    this.createdAt = props.createdAt ?? new Date();
    this.tenant = props.tenant ?? { tenantId: props.tenantId ?? "" };
  }
}

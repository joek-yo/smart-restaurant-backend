export interface WorkflowTimelineProps {
  tenantId: string;
  workflowId: string;
  eventType: string;
  traceId?: string;
  payload?: Record<string, unknown>;
}

export class WorkflowTimelineEntity {
  id: string;
  tenantId: string;
  workflowId: string;
  eventType: string;
  traceId: string;
  payload?: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;

  constructor(props: WorkflowTimelineProps) {
    this.id = Math.random().toString(36).slice(2);
    this.tenantId = props.tenantId;
    this.workflowId = props.workflowId;
    this.eventType = props.eventType;
    this.traceId = props.traceId ?? this.id;
    this.payload = props.payload;
    this.occurredAt = new Date();
    this.createdAt = new Date();
  }
}

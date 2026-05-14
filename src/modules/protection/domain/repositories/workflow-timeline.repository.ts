import { WorkflowTimelineEntity } from '../entities/workflow-timeline.entity';
export interface WorkflowTimelineRepository {
  save(entity: WorkflowTimelineEntity): Promise<void>;
  findByTraceId(traceId: string): Promise<WorkflowTimelineEntity[]>;
  findRecentByTenant(tenantId: string, limit?: number): Promise<WorkflowTimelineEntity[]>;
}
export const WORKFLOW_TIMELINE_REPOSITORY = Symbol('WorkflowTimelineRepository');

import { WorkflowLockEntity } from '../entities/workflow-lock.entity';
import { WorkflowLockId } from '../value-objects/workflow-lock-id.vo';

export interface WorkflowLockRepository {
  save(lock: WorkflowLockEntity): Promise<void>;
  findById(lockId: WorkflowLockId): Promise<WorkflowLockEntity | null>;
  delete(lockId: WorkflowLockId): Promise<void>;
}
export const WORKFLOW_LOCK_REPOSITORY = Symbol('WorkflowLockRepository');

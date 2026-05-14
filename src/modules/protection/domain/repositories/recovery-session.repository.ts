import { RecoverySessionEntity } from '../entities/recovery-session.entity';
export interface RecoverySessionRepository {
  create(s: RecoverySessionEntity): Promise<void>;
  findById(id: string): Promise<RecoverySessionEntity | null>;
  findByWorkflow(tenantId: string, workflowId: string): Promise<RecoverySessionEntity[]>;
  findByUser(tenantId: string, userId: string): Promise<RecoverySessionEntity[]>;
  updateStatus(id: string, status: 'success' | 'failed' | 'partial'): Promise<void>;
  deleteById(id: string): Promise<void>;
}
export const RECOVERY_SESSION_REPOSITORY = Symbol('RecoverySessionRepository');

import { ProtectionReportEntity } from '../entities/protection-report.entity';
export interface ProtectionReportRepository {
  create(r: ProtectionReportEntity): Promise<void>;
  findById(id: string): Promise<ProtectionReportEntity | null>;
  findByTenant(tenantId: string): Promise<ProtectionReportEntity[]>;
  findByWorkflowType(tenantId: string, workflowType: string): Promise<ProtectionReportEntity[]>;
  findLatest(tenantId: string): Promise<ProtectionReportEntity | null>;
  deleteById(id: string): Promise<void>;
}
export const PROTECTION_REPORT_REPOSITORY = Symbol('ProtectionReportRepository');

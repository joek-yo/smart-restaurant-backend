export interface ProtectionReportProps {
  tenantId: string; workflowId: string; reportType: string;
  details?: Record<string, unknown>;
}
export class ProtectionReportEntity {
  id: string; tenantId: string; workflowId: string;
  reportType: string; details?: Record<string, unknown>; createdAt: Date;
  constructor(props: ProtectionReportProps) {
    this.id = Math.random().toString(36).slice(2);
    this.tenantId = props.tenantId; this.workflowId = props.workflowId;
    this.reportType = props.reportType; this.details = props.details;
    this.createdAt = new Date();
  }
}

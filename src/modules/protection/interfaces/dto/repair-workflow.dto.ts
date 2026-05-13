// FILE: src/modules/protection/interfaces/dto/repair-workflow.dto.ts

import {
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  IsIn,
} from 'class-validator';

/**
 * RepairWorkflowDto
 * ---------------------------------------------------------
 * API-level DTO for triggering manual or automated workflow repair.
 *
 * This is used when a workflow is:
 * - stuck
 * - corrupted
 * - inconsistent
 * - partially executed
 *
 * It enters the repair pipeline BEFORE recovery logic.
 */

export enum WorkflowRepairSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class RepairWorkflowDto {
  @IsString()
  tenantId: string;

  @IsString()
  userId: string;

  @IsString()
  workflowId: string;

  @IsString()
  currentState: string;

  @IsOptional()
  @IsString()
  workflowType?: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  @IsOptional()
  @IsString()
  anomalyType?: string;

  @IsOptional()
  @IsEnum(WorkflowRepairSeverity)
  severity?: WorkflowRepairSeverity;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsIn(['repair', 'coordinator'])
  strategy?: 'repair' | 'coordinator';
}
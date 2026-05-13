// FILE: src/modules/protection/interfaces/dto/workflow-health.dto.ts

import { IsOptional, IsString, IsEnum } from 'class-validator';

/**
 * WorkflowHealthDto
 * ---------------------------------------------------------
 * API-level DTO for querying workflow health state.
 *
 * Used by:
 * - monitoring dashboards
 * - admin tools
 * - observability systems
 * - debugging workflows in production
 */

export enum WorkflowHealthScope {
  SINGLE = 'single',
  USER = 'user',
  TENANT = 'tenant',
}

export class WorkflowHealthDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  workflowId?: string;

  @IsEnum(WorkflowHealthScope)
  scope: WorkflowHealthScope;

  @IsOptional()
  @IsString()
  workflowType?:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';
}
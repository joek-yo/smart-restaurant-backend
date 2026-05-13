// FILE: src/modules/protection/interfaces/dto/recover-session.dto.ts

import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';

/**
 * RecoverSessionDto
 * ---------------------------------------------------------
 * API-level DTO for triggering session recovery.
 *
 * This is the ENTRY CONTRACT between external systems
 * (API / Gateway / Webhooks) and the recovery system.
 */

export enum SessionRecoveryReason {
  TIMEOUT = 'TIMEOUT',
  RECONNECT = 'RECONNECT',
  MANUAL = 'MANUAL',
  CORRUPTION = 'CORRUPTION',
}

export class RecoverSessionDto {
  @IsString()
  tenantId: string;

  @IsString()
  userId: string;

  @IsString()
  sessionId: string;

  @IsString()
  currentState: string;

  @IsEnum(SessionRecoveryReason)
  reason: SessionRecoveryReason;

  @IsOptional()
  @IsString()
  workflowType?: 'session';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
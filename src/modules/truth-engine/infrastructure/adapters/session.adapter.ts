// FILE: src/modules/truth-engine/infrastructure/adapters/session.adapter.ts

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '@modules/sessions/domain/repositories/session.repository';
import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';

/**
 * SessionAdapter
 * --------------
 * Truth Engine boundary adapter for Session data.
 *
 * Responsibilities:
 * - Fetch session from SessionRepository
 * - Provide cart + checkout + lifecycle state to Truth Engine
 * - Keep repository layer isolated from Truth Engine logic
 *
 * IMPORTANT RULES:
 * - NO computation (totals, engagement, etc.)
 * - NO normalization (handled in TruthNormalizerService)
 * - NO caching logic
 */
@Injectable()
export class SessionAdapter {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  /**
   * Fetch session by sessionId
   */
  async fetch(input: { tenantId: string; sessionId: string; userId: string }) {
    return this.getById(input.sessionId);
  }

  async getById(sessionId: string): Promise<SessionEntity | null> {
    return this.sessionRepository.findById(sessionId);
  }

  /**
   * Fetch active session for user (tenant-scoped)
   */
  async getActiveByUser(input: {
    tenantId: string;
    userId: string;
    branchId?: string;
  }): Promise<SessionEntity | null> {
    return this.sessionRepository.findActiveByUser(input);
  }

  /**
   * Fetch all sessions for tenant (useful for analytics / debugging)
   */
  async getByTenant(tenantId: string): Promise<SessionEntity[]> {
    return this.sessionRepository.findByTenant(tenantId);
  }

  /**
   * Fetch expired sessions (useful for recovery engine hooks)
   */
  async getExpired(): Promise<SessionEntity[]> {
    return this.sessionRepository.findExpiredSessions();
  }
}
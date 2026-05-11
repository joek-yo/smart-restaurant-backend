// src/modules/sessions/application/services/session.service.ts
//
// ✅ FIX 4 — Tenant isolation. No more businessId: 'default'.
// Every operation is scoped to tenantId + userId + optional branchId.

import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionEntity } from '../../domain/entities/session.entity';

export interface SessionScope {
  userId: string;
  tenantId: string;
  branchId?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly sessionRepo: SessionRepository) {}

  // ─── Core: tenant-scoped get or create ───────────────────────────────────

  async getOrCreate(
    userId: string,
    tenantId: string,
    branchId?: string,
  ): Promise<SessionEntity> {
    if (!tenantId) {
      throw new Error('SessionService.getOrCreate: tenantId is required');
    }

    const sessions = await this.sessionRepo.findByUserId(userId);

    let session = sessions.find(
      (s) =>
        s.businessId === tenantId &&
        (branchId ? s.branchId === branchId : true),
    );

    if (session) return session;

    session = new SessionEntity({
      userId,
      businessId: tenantId,
      branchId: branchId ?? 'main',
      items: [],
    });

    this.logger.log(`[Session] Created new session userId=${userId} tenantId=${tenantId}`);

    return this.sessionRepo.save(session);
  }

  // ─── Fetch by scope ───────────────────────────────────────────────────────

  async getSession(scope: SessionScope): Promise<SessionEntity | null> {
    const { userId, tenantId, branchId } = scope;

    const sessions = await this.sessionRepo.findByUserId(userId);

    return (
      sessions.find(
        (s) =>
          s.businessId === tenantId &&
          (branchId ? s.branchId === branchId : true),
      ) ?? null
    );
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  async save(session: SessionEntity): Promise<SessionEntity> {
    return this.sessionRepo.save(session);
  }

  async update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity> {
    return this.sessionRepo.update(id, partial);
  }

  async delete(id: string): Promise<void> {
    return this.sessionRepo.delete(id);
  }
}
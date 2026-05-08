/**
 * FILE: src/modules/sessions/application/services/session.service.ts
 *
 * REFACTORED: PURE SESSION CACHE LAYER
 * - NO business logic
 * - NO cart logic
 * - NO state transitions
 * - ONLY persistence operations
 */

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionEntity } from '../../domain/entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
  ) {}

  private getSessionScope() {
    return { businessId: 'default', branchId: 'default' };
  }

  /**
   * 🔵 PURE FETCH OR CREATE
   * No business rules allowed here
   */
  async getOrCreate(userId: string): Promise<SessionEntity> {
    const { businessId, branchId } = this.getSessionScope();

    const sessions = await this.sessionRepo.findByUserId(userId);

    let session = sessions.find((s) =>
      s.businessId === businessId &&
      s.branchId === branchId,
    );

    if (session) return session;

    session = new SessionEntity({
      userId,
      businessId,
      branchId,
      items: [],
    });

    return this.sessionRepo.save(session);
  }

  /**
   * 🔵 FETCH SESSION
   */
  async getSession(userId: string): Promise<SessionEntity | null> {
    const { businessId, branchId } = this.getSessionScope();

    const sessions = await this.sessionRepo.findByUserId(userId);

    return sessions.find((s) =>
      s.businessId === businessId &&
      s.branchId === branchId,
    ) || null;
  }

  /**
   * 🔵 SAVE SESSION
   */
  async save(session: SessionEntity): Promise<SessionEntity> {
    return this.sessionRepo.save(session);
  }

  /**
   * 🔵 UPDATE SESSION (PARTIAL PATCH ONLY)
   */
  async update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    return this.sessionRepo.update(id, partial);
  }

  /**
   * 🔵 DELETE SESSION (optional utility)
   */
  async delete(id: string): Promise<void> {
    return this.sessionRepo.delete(id);
  }
}
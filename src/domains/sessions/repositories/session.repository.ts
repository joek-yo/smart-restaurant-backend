// FILE: src/domains/sessions/repositories/session.repository.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { SessionStatus } from '../constants/session-states';
import { v4 as uuidv4 } from 'uuid';

// Abstract contract (DI token)
export abstract class SessionRepository {
  abstract create(session: SessionEntity): Promise<SessionEntity>;

  abstract update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity>;

  abstract findById(
    id: string,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity | null>;

  abstract findActiveByUser(
    userId: string,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity | null>;

  abstract findByStatus(
    status: SessionStatus,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity[]>;

  abstract delete(id: string): Promise<void>;
}

@Injectable()
export class InMemorySessionRepository extends SessionRepository {
  private sessions: Map<string, SessionEntity> = new Map();

  async create(session: SessionEntity): Promise<SessionEntity> {
    if (!session.id) session.id = uuidv4();

    session.createdAt = new Date();
    session.updatedAt = new Date();

    this.sessions.set(session.id, session);
    return session;
  }

  async update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    const existing = this.sessions.get(id);

    if (!existing) {
      throw new Error(`Session ${id} not found`);
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      partial,
      { updatedAt: new Date() },
    ) as SessionEntity;

    this.sessions.set(id, updated);

    return updated;
  }

  async findById(
    id: string,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity | null> {
    const session = this.sessions.get(id);

    if (!session) return null;

    if (businessId && session.businessId !== businessId) return null;
    if (branchId && session.branchId !== branchId) return null;

    return session;
  }

  async findActiveByUser(
    userId: string,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity | null> {
    for (const session of this.sessions.values()) {
      if (
        session.userId === userId &&
        // ✅ FIX: unified via entity compatibility getter (no TS conflict)
        (session as any).status !== SessionStatus.EXPIRED &&
        (!businessId || session.businessId === businessId) &&
        (!branchId || session.branchId === branchId)
      ) {
        return session;
      }
    }
    return null;
  }

  async findByStatus(
    status: SessionStatus,
    businessId?: string,
    branchId?: string,
  ): Promise<SessionEntity[]> {
    return Array.from(this.sessions.values()).filter((s) => {
      return (
        // ✅ FIX: safe runtime access without TS clash
        (s as any).status === status &&
        (!businessId || s.businessId === businessId) &&
        (!branchId || s.branchId === branchId)
      );
    });
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
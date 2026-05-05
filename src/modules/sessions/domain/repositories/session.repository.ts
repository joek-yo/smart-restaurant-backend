// src/modules/sessions/domain/repositories/session.repository.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';

export abstract class SessionRepository {
  abstract save(session: SessionEntity): Promise<SessionEntity>;
  abstract update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity>;
  abstract findById(id: string): Promise<SessionEntity | null>;
  abstract findByUserId(userId: string): Promise<SessionEntity[]>;
  abstract delete(id: string): Promise<void>;
}

@Injectable()
export class InMemorySessionRepository extends SessionRepository {
  private sessions: Map<string, SessionEntity> = new Map();

  async save(session: SessionEntity): Promise<SessionEntity> {
    if (!session.id) session.id = uuidv4();
    session.createdAt = new Date();
    session.updatedAt = new Date();
    this.sessions.set(session.id, session);
    return session;
  }

  async update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity> {
    const existing = this.sessions.get(id);
    if (!existing) throw new Error(`Session ${id} not found`);

    const updated = new SessionEntity({
      ...existing,
      ...partial,
      updatedAt: new Date(),
    });

    this.sessions.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<SessionEntity | null> {
    return this.sessions.get(id) || null;
  }

  async findByUserId(userId: string): Promise<SessionEntity[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId,
    );
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

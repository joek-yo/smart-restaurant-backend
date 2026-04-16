// FILE: src/domains/sessions/repositories/session.repository.ts

// FILE: src/domains/sessions/repositories/session.repository.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';

// ========================
// ABSTRACT CONTRACT (CLEAN)
// ========================
export abstract class SessionRepository {
  abstract create(session: SessionEntity): Promise<SessionEntity>;

  abstract update(session: SessionEntity): Promise<SessionEntity>;

  abstract findById(id: string): Promise<SessionEntity | null>;

  // ✅ Added simple query filter for User ID
  abstract findByUserId(userId: string): Promise<SessionEntity[]>;

  abstract delete(id: string): Promise<void>;
}

// ========================
// IN-MEMORY IMPLEMENTATION
// ========================
@Injectable()
export class InMemorySessionRepository extends SessionRepository {
  private sessions: Map<string, SessionEntity> = new Map();

  // =========================
  // CREATE
  // =========================
  async create(session: SessionEntity): Promise<SessionEntity> {
    if (!session.id) session.id = uuidv4();

    session.createdAt = new Date();
    session.updatedAt = new Date();

    this.sessions.set(session.id, session);

    return session;
  }

  // =========================
  // UPDATE
  // =========================
  async update(session: SessionEntity): Promise<SessionEntity> {
    if (!session.id) {
      throw new Error('Session must have an id');
    }

    const existing = this.sessions.get(session.id);

    if (!existing) {
      throw new Error(`Session ${session.id} not found`);
    }

    const updated = new SessionEntity({
      ...existing,
      ...session,
      updatedAt: new Date(),
    });

    this.sessions.set(session.id, updated);

    return updated;
  }

  // =========================
  // FIND BY ID
  // =========================
  async findById(id: string): Promise<SessionEntity | null> {
    return this.sessions.get(id) || null;
  }

  // =========================
  // FIND BY USER ID (FILTER)
  // =========================
  async findByUserId(userId: string): Promise<SessionEntity[]> {
    // Returns all sessions associated with this user ID
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  // =========================
  // DELETE
  // =========================
  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
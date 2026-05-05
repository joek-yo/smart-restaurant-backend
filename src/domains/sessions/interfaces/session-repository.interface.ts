// 📁 src/domains/sessions/repositories/session.repository.ts

import { SessionEntity } from '../entities/session.entity';
import { SessionRepository } from '../interfaces/session-repository.interface';

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, SessionEntity>();

  async findById(id: string): Promise<SessionEntity | null> {
    return this.sessions.get(id) || null;
  }

  async save(session: SessionEntity): Promise<SessionEntity> {
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * ✅ Fixed signature and implementation
   * Merges partial updates safely into the existing entity
   */
  async update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity> {
    const existing = this.sessions.get(id);
    
    if (!existing) {
      throw new Error(`Session with ID ${id} not found`);
    }

    const updated: SessionEntity = {
      ...existing,
      ...partial,
      updatedAt: new Date(), // Enforce timestamp update
    };

    this.sessions.set(id, updated);
    return updated;
  }

  /**
   * ✅ Added missing query method
   */
  async findByUserId(userId: string): Promise<SessionEntity[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId
    );
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
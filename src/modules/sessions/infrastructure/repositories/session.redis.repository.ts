// src/modules/sessions/infrastructure/repositories/session.redis.repository.ts

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionCacheRepository } from '../../domain/repositories/session-cache.repository';
import { SessionIndexRepository } from './session-index.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedisSessionRepository extends SessionRepository {
  private readonly TTL = 60 * 60;

  constructor(
    private readonly cache: SessionCacheRepository,
    private readonly index: SessionIndexRepository,
  ) { super(); }

  async save(session: SessionEntity): Promise<SessionEntity> {
    if (!session.id) session.id = uuidv4();
    session.createdAt = session.createdAt ?? new Date();
    session.updatedAt = new Date();
    await this.cache.set(session, this.TTL);
    const raw = await this.index.getSessionId(session.userId);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (ids.indexOf(session.id) === -1) {
      ids.push(session.id);
      await this.index.setSessionId(session.userId, JSON.stringify(ids), this.TTL);
    }
    return session;
  }

  async update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Session ' + id + ' not found');
    const updated = new SessionEntity({ ...existing, ...partial, updatedAt: new Date() });
    await this.cache.set(updated, this.TTL);
    return updated;
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const raw = await this.cache.get(id);
    if (!raw) return null;
    return new SessionEntity(raw);
  }

  async findByUserId(userId: string): Promise<SessionEntity[]> {
    const raw = await this.index.getSessionId(userId);
    if (!raw) return [];
    let ids: string[];
    try { ids = JSON.parse(raw); } catch { ids = [raw]; }
    const sessions = await Promise.all(ids.map((id) => this.findById(id)));
    return sessions.filter((s): s is SessionEntity => s !== null);
  }

  async delete(id: string): Promise<void> {
    const session = await this.findById(id);
    if (session) {
      const raw = await this.index.getSessionId(session.userId);
      if (raw) {
        let ids: string[];
        try { ids = JSON.parse(raw); } catch { ids = [raw]; }
        const filtered = ids.filter((i) => i !== id);
        if (filtered.length > 0) {
          await this.index.setSessionId(session.userId, JSON.stringify(filtered), this.TTL);
        } else {
          await this.index.delete(session.userId);
        }
      }
    }
    await this.cache.delete(id);
  }
}

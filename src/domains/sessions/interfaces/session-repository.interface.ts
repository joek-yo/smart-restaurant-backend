// 📁 src/domains/sessions/interfaces/session-repository.interface.ts

import { SessionEntity } from '../entities/session.entity';

/**
 * Canonical contract for Session persistence
 * (Used across services, use-cases, adapters)
 */
export interface SessionRepositoryInterface {
  create(session: SessionEntity): Promise<SessionEntity>;

  update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity>;

  findById(id: string): Promise<SessionEntity | null>;

  /**
   * Returns the active (non-expired) session for a user
   */
  findActiveByUser(userId: string): Promise<SessionEntity | null>;

  /**
   * Optional filtering by state (START, CHECKOUT, EXPIRED, etc.)
   */
  findByState(state: string): Promise<SessionEntity[]>;

  delete(id: string): Promise<void>;
}
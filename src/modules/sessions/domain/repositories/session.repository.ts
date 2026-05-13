// FILE: src/modules/sessions/domain/repositories/session.repository.ts

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { SessionEntity } from '../entities/session.entity';

export interface FindSessionByUserInput {
  tenantId: string;
  userId: string;
  branchId?: string;
}

export abstract class SessionRepository {
  abstract save(
    session: SessionEntity,
  ): Promise<SessionEntity>;

  abstract update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity>;

  abstract findById(
    id: string,
  ): Promise<SessionEntity | null>;

  abstract findActiveByUser(
    input: FindSessionByUserInput,
  ): Promise<SessionEntity | null>;

  abstract findByTenant(
    tenantId: string,
  ): Promise<SessionEntity[]>;

  abstract findExpiredSessions(): Promise<
    SessionEntity[]
  >;

  abstract delete(id: string): Promise<void>;
}

@Injectable()
export class InMemorySessionRepository
  extends SessionRepository
{
  private readonly sessions = new Map<
    string,
    SessionEntity
  >();

  async save(
    session: SessionEntity,
  ): Promise<SessionEntity> {
    const now = new Date();

    if (!session.id) {
      session.id = uuidv4();
      session.createdAt = now;
    }

    session.updatedAt = now;

    const entity = new SessionEntity({
      ...session,
    });

    this.sessions.set(session.id, entity);

    return entity;
  }

  async update(
    id: string,
    partial: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    const existing =
      await this.findById(id);

    if (!existing) {
      throw new Error(
        `Session ${id} not found`,
      );
    }

    const updated = new SessionEntity({
      ...existing,
      ...partial,
      id,
      updatedAt: new Date(),
    });

    this.sessions.set(id, updated);

    return updated;
  }

  async findById(
    id: string,
  ): Promise<SessionEntity | null> {
    const session =
      this.sessions.get(id);

    if (!session) {
      return null;
    }

    return new SessionEntity({
      ...session,
    });
  }

  async findActiveByUser({
    tenantId,
    userId,
    branchId,
  }: FindSessionByUserInput): Promise<SessionEntity | null> {
    const sessions = Array.from(
      this.sessions.values(),
    );

    const found = sessions.find((session) => {
      const sameTenant =
        session.tenantId === tenantId;

      const sameUser =
        session.userId === userId;

      const sameBranch = branchId
        ? session.branchId === branchId
        : true;

      const notExpired =
        !session.isExpired;

      return (
        sameTenant &&
        sameUser &&
        sameBranch &&
        notExpired
      );
    });

    if (!found) {
      return null;
    }

    return new SessionEntity({
      ...found,
    });
  }

  async findByTenant(
    tenantId: string,
  ): Promise<SessionEntity[]> {
    return Array.from(
      this.sessions.values(),
    )
      .filter(
        (session) =>
          session.tenantId === tenantId,
      )
      .map(
        (session) =>
          new SessionEntity({
            ...session,
          }),
      );
  }

  async findExpiredSessions(): Promise<
    SessionEntity[]
  > {
    const now = Date.now();

    return Array.from(
      this.sessions.values(),
    )
      .filter((session) => {
        if (!session.expiresAt) {
          return false;
        }

        return (
          session.expiresAt.getTime() <= now
        );
      })
      .map(
        (session) =>
          new SessionEntity({
            ...session,
          }),
      );
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
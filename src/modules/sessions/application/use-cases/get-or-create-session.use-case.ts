// FILE: src/modules/sessions/application/use-cases/get-or-create-session.use-case.ts

import { Injectable } from '@nestjs/common';

import { SessionService } from '../services/session.service';
import { SessionEntity } from '../../domain/entities/session.entity';

@Injectable()
export class GetOrCreateSessionUseCase {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // 🧠 ENTRY POINT
  // ==================================================

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
  }): Promise<SessionEntity> {
    const { userId, tenantId, branchId } = input;

    // 1. Try fetch existing session
    const existing = await this.findExisting(userId, tenantId, branchId);

    if (existing) {
      return existing;
    }

    // 2. Create new session via SessionService
    const session = await this.sessionService.getOrCreate(
      userId,
      tenantId,
      branchId,
    );

    return session;
  }

  // ==================================================
  // 🔍 INTERNAL LOOKUP LOGIC
  // ==================================================

  private async findExisting(
    userId: string,
    tenantId: string,
    branchId?: string,
  ): Promise<SessionEntity | null> {
    const session = await this.sessionService.getOrCreate(
      userId,
      tenantId,
      branchId,
    );

    if (!session) return null;

    // Validate ownership match
    if (
      session.userId === userId &&
      session.businessId === tenantId &&
      session.branchId === branchId
    ) {
      return session;
    }

    return null;
  }
}
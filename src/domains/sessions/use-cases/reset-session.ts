// src/modules/sessions/use-cases/reset-session.ts

import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions.service';

@Injectable()
export class ResetSessionUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  execute(phone: string) {
    this.sessionsService.resetSession(phone);

    return {
      message: 'Session reset successfully',
    };
  }
}
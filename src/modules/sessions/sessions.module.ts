// src/modules/sessions/sessions.module.ts

import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  controllers: [SessionsController], // ✅ MUST BE HERE
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
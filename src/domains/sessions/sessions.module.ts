// src/modules/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CartModule } from './cart.module';

@Module({
  imports: [CartModule], // ✅ provides CartService
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
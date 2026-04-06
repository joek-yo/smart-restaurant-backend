// src/infrastructure/notifications/providers/sms.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  async send(input: { to: string; message: string }) {
    this.logger.log(`(MOCK) Sending SMS → ${input.to}: ${input.message}`);
  }
}

// DO NOT use export default
// export default SmsProvider; ← remove this
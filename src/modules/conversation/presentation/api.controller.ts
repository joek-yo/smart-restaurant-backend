// FILE: src/modules/conversation/presentation/api.controller.ts

import { Controller, Post, Body, Headers } from '@nestjs/common';
import { MessageRouter } from './gateway/message.router';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/conversation')
export class ApiController {
  constructor(
    private readonly messageRouter: MessageRouter,
  ) {}

  @Post('message')
  async handleMessage(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const tenantId = body.tenantId || headers['x-tenant-id'];

    // ==================================================
    // NORMAL FLOW (OPT-OUT HANDLED INSIDE ROUTER)
    // ==================================================

    const result = await this.messageRouter.routeApi({
      userId: body.userId,
      tenantId,
      message: body.message,
      messageId: body.messageId ?? uuidv4(),
      metadata: {
        source: 'api',
        headers,
      },
    });

    return {
      success: true,
      data: result,
    };
  }
}
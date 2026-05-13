// FILE: src/modules/conversation/presentation/webchat.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { MessageRouter } from './gateway/message.router';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/conversation/webchat')
export class WebChatController {
  constructor(private readonly messageRouter: MessageRouter) {}

  @Post('message')
  async handleMessage(@Body() body: any) {
    const result = await this.messageRouter.routeWebChat({
      userId: body.userId,
      tenantId: body.tenantId,
      message: body.message,
      messageId: body.messageId ?? uuidv4(),
      metadata: { source: 'webchat', raw: body },
    });

    return { success: true, data: result };
  }
}
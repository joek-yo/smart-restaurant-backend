// FILE: src/modules/conversation/presentation/gateway/message.router.ts

import { Injectable, Logger } from '@nestjs/common';
import { ChannelGateway, ChannelMessage, ChannelResponse } from './channel.gateway';

@Injectable()
export class MessageRouter {
  private readonly logger = new Logger(MessageRouter.name);

  constructor(private readonly gateway: ChannelGateway) {}

  async route(
    channel: string,
    msg: Omit<ChannelMessage, 'channel'>,
  ): Promise<ChannelResponse> {
    this.logger.debug(`[MessageRouter] routing channel=${channel}`);
    return this.gateway.receive({ ...msg, channel });
  }

  async routeWhatsApp(msg: Omit<ChannelMessage, 'channel'>): Promise<ChannelResponse> {
    return this.route('whatsapp', msg);
  }

  async routeWebChat(msg: Omit<ChannelMessage, 'channel'>): Promise<ChannelResponse> {
    return this.route('webchat', msg);
  }

  async routeApi(msg: Omit<ChannelMessage, 'channel'>): Promise<ChannelResponse> {
    return this.route('api', msg);
  }
}

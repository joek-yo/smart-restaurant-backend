// FILE: src/modules/conversation/application/flows/flow.registry.ts

import { Injectable, Logger } from '@nestjs/common';

export interface ConversationFlow {
  name: string;
  execute(ctx: any): Promise<{ handled: boolean; response?: string; nextFlow?: string; endFlow?: boolean }>;
}

@Injectable()
export class FlowRegistry {
  private readonly logger = new Logger(FlowRegistry.name);
  private readonly flows = new Map<string, ConversationFlow>();

  register(flow: ConversationFlow): void {
    this.flows.set(flow.name, flow);
    this.logger.log(`[FlowRegistry] registered: ${flow.name}`);
  }

  get(name: string): ConversationFlow | undefined {
    return this.flows.get(name);
  }

  has(name: string): boolean {
    return this.flows.has(name);
  }

  list(): string[] {
    return [...this.flows.keys()];
  }
}

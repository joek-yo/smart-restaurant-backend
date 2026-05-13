import { Injectable, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { BaseAction } from './base.action';

@Injectable()
export class ActionRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(ActionRegistry.name);
  private readonly actions = new Map<string, BaseAction>();

  // Runs AFTER all onModuleInit hooks — guaranteed complete registration
  onApplicationBootstrap() {
    this.logger.log(
      `[ActionRegistry] ${this.actions.size} actions registered: ${this.list().join(', ')}`,
    );
  }

  register(name: string, action: BaseAction): void {
    if (this.actions.has(name)) {
      this.logger.warn(`[ActionRegistry] Overwriting action: ${name}`);
    }
    this.actions.set(name, action);
    this.logger.log(`[ActionRegistry] Registered action: ${name}`);
  }

  resolve(name: string): BaseAction | undefined {
    return this.actions.get(name);
  }

  has(name: string): boolean {
    return this.actions.has(name);
  }

  list(): string[] {
    return Array.from(this.actions.keys());
  }
}

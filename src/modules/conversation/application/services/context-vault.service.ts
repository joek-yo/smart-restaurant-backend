// FILE: src/modules/conversation/application/services/context-vault.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';

export type VaultNamespace = 'user' | 'flow' | 'ai' | 'commerce' | 'system';

@Injectable()
export class ContextVaultService {
  private readonly logger = new Logger(ContextVaultService.name);

  constructor(private readonly redisRepo: ConversationRedisRepository) {}

  async set(context: ConversationContextEntity, namespace: VaultNamespace, key: string, value: any): Promise<void> {
    context.setMemory(this.vaultKey(namespace, key), value);
    await this.redisRepo.saveContext(context);
  }

  get<T = any>(context: ConversationContextEntity, namespace: VaultNamespace, key: string, defaultValue?: T): T | undefined {
    return context.getMemory<T>(this.vaultKey(namespace, key)) ?? defaultValue;
  }

  getNamespace(context: ConversationContextEntity, namespace: VaultNamespace): Record<string, any> {
    const prefix = `${namespace}:`;
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(context.memory ?? {})) {
      if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
    }
    return result;
  }

  async delete(context: ConversationContextEntity, namespace: VaultNamespace, key: string): Promise<void> {
    delete context.memory[this.vaultKey(namespace, key)];
    await this.redisRepo.saveContext(context);
  }

  async setMany(context: ConversationContextEntity, namespace: VaultNamespace, values: Record<string, any>): Promise<void> {
    for (const [k, v] of Object.entries(values)) {
      context.setMemory(this.vaultKey(namespace, k), v);
    }
    await this.redisRepo.saveContext(context);
  }

  async clearNamespace(context: ConversationContextEntity, namespace: VaultNamespace): Promise<void> {
    const prefix = `${namespace}:`;
    for (const k of Object.keys(context.memory ?? {})) {
      if (k.startsWith(prefix)) delete context.memory[k];
    }
    await this.redisRepo.saveContext(context);
  }

  // Produces a compact string for injection into AI system prompts
  snapshot(context: ConversationContextEntity): string {
    const user = this.getNamespace(context, 'user');
    const commerce = this.getNamespace(context, 'commerce');
    const flow = this.getNamespace(context, 'flow');
    const lines: string[] = [];
    if (user.language)        lines.push(`Language: ${user.language}`);
    if (user.name)            lines.push(`User name: ${user.name}`);
    if (flow.currentFlow)     lines.push(`Active flow: ${flow.currentFlow}`);
    if (commerce.lastProduct) lines.push(`Last viewed product: ${commerce.lastProduct}`);
    return lines.join('\n');
  }

  private vaultKey(namespace: VaultNamespace, key: string): string {
    return `${namespace}:${key}`;
  }
}

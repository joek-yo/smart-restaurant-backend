// FILE: src/modules/conversation/application/services/semantic-context.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ContextVaultService } from './context-vault.service';

export interface SemanticEntities {
  language?: string;
  detectedName?: string;
  quantities?: number[];
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  isQuestion?: boolean;
  isGreeting?: boolean;
  isFarewell?: boolean;
}

@Injectable()
export class SemanticContextService {
  private readonly logger = new Logger(SemanticContextService.name);

  private readonly GREETINGS = ['hi', 'hello', 'hey', 'hii', 'howdy', 'sup', 'yo',
    'good morning', 'good afternoon', 'good evening', 'habari', 'mambo', 'sasa'];
  private readonly FAREWELLS = ['bye', 'goodbye', 'see you', 'later', 'ciao', 'kwaheri', 'tutaonana'];
  private readonly NEGATIVES = ['not', "don't", 'never', 'bad', 'wrong', 'broken',
    'failed', 'error', 'hate', 'terrible', 'awful', 'cancel', 'refund'];
  private readonly POSITIVES = ['good', 'great', 'thanks', 'perfect', 'love',
    'amazing', 'excellent', 'yes', 'sure', 'ok'];

  constructor(private readonly vault: ContextVaultService) {}

  extract(message: string): SemanticEntities {
    const lower = message.toLowerCase().trim();
    const words = lower.split(/\s+/);
    return {
      language:      this.detectLanguage(lower),
      detectedName:  this.extractName(message),
      quantities:    this.extractQuantities(message),
      keywords:      this.extractKeywords(words),
      sentiment:     this.detectSentiment(words),
      isQuestion:    lower.includes('?') || this.startsWithQuestionWord(lower),
      isGreeting:    this.GREETINGS.some(g => lower.startsWith(g) || lower === g),
      isFarewell:    this.FAREWELLS.some(f => lower.includes(f)),
    };
  }

  async enrich(context: ConversationContextEntity, message: string): Promise<SemanticEntities> {
    const entities = this.extract(message);
    if (entities.language)     await this.vault.set(context, 'user', 'language', entities.language);
    if (entities.detectedName) await this.vault.set(context, 'user', 'name', entities.detectedName);
    await this.vault.set(context, 'ai', 'lastKeywords', entities.keywords ?? []);
    await this.vault.set(context, 'ai', 'lastSentiment', entities.sentiment ?? 'neutral');
    return entities;
  }

  buildContextBlock(entities: SemanticEntities, vaultSnapshot: string): string {
    const lines: string[] = [];
    if (vaultSnapshot)                    lines.push(vaultSnapshot);
    if (entities.sentiment === 'negative') lines.push('Note: user appears frustrated.');
    if (entities.isQuestion)              lines.push('Note: user is asking a question.');
    if (entities.isGreeting)              lines.push('Note: user is greeting.');
    return lines.join('\n');
  }

  private detectLanguage(lower: string): string {
    const swahiliWords = ['habari', 'mambo', 'nataka', 'tafadhali', 'asante',
      'ndiyo', 'hapana', 'ninahitaji', 'kwaheri', 'karibu'];
    return swahiliWords.some(w => lower.includes(w)) ? 'sw' : 'en';
  }

  private extractName(message: string): string | undefined {
    const patterns = [
      /my name is (\w+)/i, /i am (\w+)/i, /i'm (\w+)/i,
      /call me (\w+)/i, /jina langu ni (\w+)/i,
    ];
    for (const p of patterns) {
      const m = message.match(p);
      if (m?.[1]) return m[1];
    }
    return undefined;
  }

  private extractQuantities(message: string): number[] {
    return (message.match(/\b\d+\b/g) ?? []).map(Number);
  }

  private extractKeywords(words: string[]): string[] {
    const stop = new Set(['i','me','my','the','a','an','is','it','in','on','at',
      'to','of','and','or','for','with','can','you','do','how','what','want','need']);
    return words.filter(w => w.length > 2 && !stop.has(w));
  }

  private detectSentiment(words: string[]): 'positive' | 'negative' | 'neutral' {
    const neg = words.filter(w => this.NEGATIVES.includes(w)).length;
    const pos = words.filter(w => this.POSITIVES.includes(w)).length;
    if (neg > pos) return 'negative';
    if (pos > neg) return 'positive';
    return 'neutral';
  }

  private startsWithQuestionWord(lower: string): boolean {
    return ['what','how','when','where','why','who','is','are','do','does',
      'can','could','would','should','nini','je'].some(w => lower.startsWith(w + ' '));
  }
}

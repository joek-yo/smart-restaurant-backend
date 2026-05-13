// FILE: src/modules/conversation/application/pipelines/middlewares/context-loading.middleware.ts

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';
import { LoadContextUseCase } from '../../use-cases/load-context.use-case';
import { ConversationHistoryService } from '../../services/conversation-history.service';
import { SemanticContextService } from '../../services/semantic-context.service';

const logger = new Logger('ContextLoadingMiddleware');

export const buildContextLoadingMiddleware = (
  loadContext: LoadContextUseCase,
  history: ConversationHistoryService,
  semantic: SemanticContextService,
): MiddlewareFn => async (ctx, next) => {

  // ── 1. LOAD / CREATE CONTEXT ──────────────────────────────
  ctx.context = await loadContext.execute({
    tenantId: ctx.input.tenantId,
    userId: ctx.input.userId,
    channel: ctx.input.channel,
  });

  // ── 2. APPEND INBOUND MESSAGE TO HISTORY ─────────────────
  await history.append(ctx.input.tenantId, ctx.input.userId, {
    role: 'user',
    content: ctx.input.message,
    timestamp: new Date().toISOString(),
    messageId: ctx.input.messageId,
  });

  // ── 3. SEMANTIC ENRICHMENT ───────────────────────────────
  const entities = await semantic.enrich(ctx.context, ctx.input.message);
  ctx.semanticEntities = entities;

  logger.debug(
    `[ContextLoading] state=${ctx.context.state} user=${ctx.input.userId} lang=${entities.language} sentiment=${entities.sentiment}`,
  );

  await next();
};

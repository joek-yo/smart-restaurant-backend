// conversation-lock.middleware.ts
// Prevents concurrent processing of messages for the same user.
// Uses in-memory lock map (replace with Redis SETNX for multi-instance).

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('ConversationLockMiddleware');
const activeLocks = new Map<string, number>();
const LOCK_TTL_MS = 10_000; // 10 seconds max lock

export const conversationLockMiddleware: MiddlewareFn = async (ctx, next) => {
  const key = `${ctx.input?.tenantId}:${ctx.input?.userId}`;
  const now = Date.now();

  const existingLock = activeLocks.get(key);
  if (existingLock && now - existingLock < LOCK_TTL_MS) {
    logger.warn(`[ConversationLock] Concurrent message blocked for ${key}`);
    ctx.response = 'Your previous message is still being processed. Please wait.';
    ctx.aborted = true;
    return;
  }

  activeLocks.set(key, now);

  try {
    await next();
  } finally {
    activeLocks.delete(key);
  }
};

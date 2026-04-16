// src/shared/types/notification.types.ts

/**
 * Generic provider response
 */
export type ProviderResponse = {
  success: boolean;
  provider: string;
};

/**
 * Retry metadata
 */
export type RetryMetadata = {
  attempts: number;
  lastAttemptAt?: Date;
};
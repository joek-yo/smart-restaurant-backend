// src/shared/utils/format-message.util.ts

/**
 * Format message before sending
 */
export function formatMessage(message: string): string {
  if (!message) return '';

  return message
    .trim()
    .replace(/\s+/g, ' '); // remove extra spaces
}
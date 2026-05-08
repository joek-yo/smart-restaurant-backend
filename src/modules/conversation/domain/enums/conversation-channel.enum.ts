/**
 * ConversationChannel
 * -----------------------
 * Makes the engine channel-agnostic.
 * Maps incoming requests to a unified processing flow.
 */
export enum ConversationChannel {
  WHATSAPP = 'WHATSAPP',
  WEB = 'WEB',
  API = 'API',

  // Prepared for future expansion
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
}

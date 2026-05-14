// FILE: src/modules/follow-up-engine/domain/enums/follow-up-type.enum.ts

/**
 * FollowUpType
 * -------------------------------------------------------
 * Defines ALL supported follow-up categories
 * across the platform.
 *
 * IMPORTANT:
 * - Pure business classification only
 * - No delivery/channel logic
 * - No scheduling logic
 * - No orchestration logic
 *
 * This enum becomes the canonical language
 * for follow-up workflows everywhere.
 */

export enum FollowUpType {
  /**
   * User abandoned cart/checkout flow.
   *
   * Example:
   * - Added items but disappeared
   * - Checkout timed out
   * - Conversation abandoned
   */
  ABANDONED_CART = 'ABANDONED_CART',

  /**
   * Payment failed or expired.
   *
   * Example:
   * - M-Pesa timeout
   * - Card declined
   * - User closed payment flow
   */
  PAYMENT_RETRY = 'PAYMENT_RETRY',

  /**
   * Resume interrupted checkout.
   *
   * Example:
   * - User disconnected mid-checkout
   * - Session recovery flow
   */
  CHECKOUT_RESUME = 'CHECKOUT_RESUME',

  /**
   * Reminder about pending/inactive order.
   *
   * Example:
   * - Awaiting confirmation
   * - Pending pickup
   * - Pending completion
   */
  ORDER_REMINDER = 'ORDER_REMINDER',

  /**
   * Re-engage inactive customer.
   *
   * Example:
   * - No activity for days/weeks
   * - Win-back campaigns
   * - Dormant customers
   */
  REACTIVATION = 'REACTIVATION',
}
// src/modules/checkout/presentation/dto/confirm-checkout.dto.ts

import { IsString } from 'class-validator';

/**
 * CONFIRM CHECKOUT DTO
 * --------------------
 */

export class ConfirmCheckoutDto {
  @IsString()
  userId: string;

  /**
   * Used for idempotency protection
   * prevents duplicate confirmations
   */
  @IsString()
  requestId: string;
}
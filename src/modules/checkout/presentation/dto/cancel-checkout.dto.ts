// src/modules/checkout/presentation/dto/cancel-checkout.dto.ts

import { IsString } from 'class-validator';

/**
 * CANCEL CHECKOUT DTO
 * -------------------
 */

export class CancelCheckoutDto {
  @IsString()
  userId: string;
}
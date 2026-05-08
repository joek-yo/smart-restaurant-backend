// src/modules/checkout/presentation/dto/start-checkout.dto.ts

import { IsString } from 'class-validator';

/**
 * START CHECKOUT DTO
 * ------------------
 */

export class StartCheckoutDto {
  @IsString()
  userId: string;
}
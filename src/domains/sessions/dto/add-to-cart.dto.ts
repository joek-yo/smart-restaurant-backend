// src/modules/sessions/dto/add-to-cart.dto.ts
import { ProductSnapshot } from '../cart.service';

export class AddToCartDto {
  phone!: string;            // definite assignment
  item!: ProductSnapshot;    // definite assignment
  quantity?: number;         // optional, default 1
}
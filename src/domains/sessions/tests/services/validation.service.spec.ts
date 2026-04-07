// 📁 src/domains/sessions/tests/services/validation.service.spec.ts

import { ValidationService } from '../../../services/validation.service';
import { AddToCartDto } from '../../../dto/add-to-cart.dto';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  it('should validate AddToCartDto successfully', async () => {
    const dto: AddToCartDto = { userId: 'user1', productId: 'p1', quantity: 2 };
    const result = await service.validateAddToCart(dto);
    expect(result).toBe(true);
  });

  it('should throw error for invalid AddToCartDto', async () => {
    const dto: any = { userId: '', productId: '', quantity: 0 };
    await expect(service.validateAddToCart(dto)).rejects.toThrow();
  });
});
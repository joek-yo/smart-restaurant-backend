//  src/modules/business/domain/repositories/business.repository.ts

import { Business } from '../entities/business.entity';

/**
 * Domain contract for Business persistence.
 * No implementation here — ONLY interface.
 */
export interface BusinessRepository {
  create(business: Business): Promise<Business>;

  findById(id: string): Promise<Business | null>;

  findAll(): Promise<Business[]>;

  update(id: string, partial: Partial<Business>): Promise<Business>;

  delete(id: string): Promise<void>;
}
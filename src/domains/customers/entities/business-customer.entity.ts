import { BusinessCustomerIdVO } from '../value-objects/business-customer-id.vo';
import { CustomerIdVO } from '../value-objects/customer-id.vo';

/**
 * BusinessCustomer Entity (TENANT RELATIONSHIP)
 * ---------------------------------------------
 * Represents a customer's relationship WITH a specific business.
 *
 * IMPORTANT:
 * - This is NOT global identity
 * - This is per-restaurant state
 * - Enables segmentation, campaigns, WhatsApp personalization
 */

export class BusinessCustomer {
  private constructor(
    private readonly id: BusinessCustomerIdVO,
    private readonly businessId: string,
    private readonly customerId: CustomerIdVO,
    private visitCount: number,
    private totalSpent: number,
    private lastOrderAt: Date | null,
    private isActive: boolean,
    private createdAt: Date,
    private updatedAt: Date,
  ) {}

  // -------------------------
  // FACTORY (NEW ENTITY)
  // -------------------------
  static create(params: {
    businessId: string;
    customerId: CustomerIdVO;
  }): BusinessCustomer {
    const now = new Date();

    return new BusinessCustomer(
      new BusinessCustomerIdVO(),
      params.businessId,
      params.customerId,
      0,
      0,
      null,
      true,
      now,
      now,
    );
  }

  // -------------------------
  // REHYDRATION (FROM DB)
  // -------------------------
  static rehydrate(data: {
    id: BusinessCustomerIdVO;
    businessId: string;
    customerId: CustomerIdVO;
    visitCount: number;
    totalSpent: number;
    lastOrderAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BusinessCustomer {
    return new BusinessCustomer(
      data.id,
      data.businessId,
      data.customerId,
      data.visitCount,
      data.totalSpent,
      data.lastOrderAt,
      data.isActive,
      data.createdAt,
      data.updatedAt,
    );
  }

  // -------------------------
  // BUSINESS LOGIC
  // -------------------------

  recordVisit(): void {
    this.visitCount += 1;
    this.lastOrderAt = new Date();
    this.touch();
  }

  addSpend(amount: number): void {
    if (amount <= 0) return;

    this.totalSpent += amount;
    this.touch();
  }

  deactivate(): void {
    this.isActive = false;
    this.touch();
  }

  activate(): void {
    this.isActive = true;
    this.touch();
  }

  // -------------------------
  // GETTERS
  // -------------------------

  getId(): BusinessCustomerIdVO {
    return this.id;
  }

  getBusinessId(): string {
    return this.businessId;
  }

  getCustomerId(): CustomerIdVO {
    return this.customerId;
  }

  getVisitCount(): number {
    return this.visitCount;
  }

  getTotalSpent(): number {
    return this.totalSpent;
  }

  getLastOrderAt(): Date | null {
    return this.lastOrderAt;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // -------------------------
  // INTERNAL
  // -------------------------

  private touch(): void {
    this.updatedAt = new Date();
  }
}
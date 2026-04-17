// src/domains/customers/entities/customer.entity.ts

import { CustomerIdVO } from '../value-objects/customer-id.vo';
import { PhoneVO } from '../value-objects/phone.vo';

/**
 * Customer Entity (GLOBAL IDENTITY)
 * ---------------------------------
 * WhatsApp-first global customer identity.
 */

export class Customer {
  private constructor(
    private readonly id: CustomerIdVO,
    private phone: PhoneVO,
    private name: string | null,
    private tags: string[],
    private lastSeenAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // -------------------------
  // FACTORY (NEW ENTITY)
  // -------------------------
  static create(params: {
    id?: CustomerIdVO;
    phone: PhoneVO;
    name?: string | null;
  }): Customer {
    const now = new Date();

    return new Customer(
      params.id ?? new CustomerIdVO(),
      params.phone,
      params.name ?? null,
      [],
      null,
      now,
      now,
    );
  }

  // -------------------------
  // REHYDRATION (FROM DATABASE)
  // -------------------------
  static rehydrate(params: {
    id: CustomerIdVO;
    phone: PhoneVO;
    name?: string | null;
    tags?: string[];
    lastSeenAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return new Customer(
      params.id,
      params.phone,
      params.name ?? null,
      params.tags ?? [],
      params.lastSeenAt ?? null,
      params.createdAt,
      params.updatedAt,
    );
  }

  // -------------------------
  // BUSINESS BEHAVIOR
  // -------------------------

  updatePhone(phone: PhoneVO): void {
    this.phone = phone;
    this.touch();
  }

  updateName(name: string): void {
    this.name = name;
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
    this.touch();
  }

  markSeen(): void {
    this.lastSeenAt = new Date();
    this.touch();
  }

  // -------------------------
  // GETTERS
  // -------------------------

  getId(): CustomerIdVO {
    return this.id;
  }

  getPhone(): PhoneVO {
    return this.phone;
  }

  getName(): string | null {
    return this.name;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getLastSeenAt(): Date | null {
    return this.lastSeenAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // -------------------------
  // PERSISTENCE HELPER
  // -------------------------

  toPersistence() {
    return {
      id: this.id.getValue(),
      phone: this.phone.getValue(),
      name: this.name,
      tags: this.tags,
      lastSeenAt: this.lastSeenAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // -------------------------
  // INTERNAL HELPERS
  // -------------------------

  private touch(): void {
    this.updatedAt = new Date();
  }
}
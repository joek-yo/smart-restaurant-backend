// src/domains/customers/value-objects/phone.vo.ts

/**
 * Phone Value Object
 * -------------------
 * Responsible for validating and normalizing phone numbers
 * into a consistent format (E.164-like where possible).
 *
 * Rules:
 * - Must contain only valid digits after normalization
 * - Must support international format (+254...)
 * - Must strip spaces, dashes, and brackets
 * - Must be immutable
 */

export class PhoneVO {
  private readonly value: string;

  constructor(phone: string) {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const normalized = PhoneVO.normalize(phone);

    if (!PhoneVO.isValid(normalized)) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    this.value = normalized;
  }

  /**
   * Returns normalized phone number
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Normalize phone to E.164-like format
   * Example:
   * 0700123456 → +254700123456
   */
  static normalize(phone: string): string {
    let cleaned = phone.trim();

    // Remove spaces, dashes, brackets
    cleaned = cleaned.replace(/[\s\-()]/g, '');

    // Kenyan local format handling (can extend later)
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    }

    // If already international but missing +
    if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Basic validation
   */
  static isValid(phone: string): boolean {
    // Must start with + and contain only digits after
    return /^\+\d{9,15}$/.test(phone);
  }

  /**
   * Compare two phone numbers safely
   */
  equals(other: PhoneVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
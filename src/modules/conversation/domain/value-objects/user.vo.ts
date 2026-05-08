/**
 * UserVO
 * -------
 * Represents the customer interacting with the system.
 * Channel-agnostic identity layer.
 */
export class UserVO {
  constructor(
    public readonly userId: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly whatsapp?: string,
    public readonly webSessionId?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId) {
      throw new Error('UserVO: userId is required');
    }
  }

  /**
   * Helper for resolving primary contact channel for notifications/replies
   */
  getPrimaryContact(): string | null {
    return this.whatsapp || this.phone || this.email || this.webSessionId || null;
  }

  /**
   * Logic to check if two user instances refer to the same identity
   */
  equals(other: UserVO): boolean {
    return this.userId === other.userId;
  }
}

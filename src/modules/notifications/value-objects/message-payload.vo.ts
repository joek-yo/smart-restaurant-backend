// src/modules/notifications/value-objects/message-payload.vo.ts

/**
 * MessagePayloadVO
 *
 * A Value Object that standardizes notification content across all channels.
 * This ensures consistency, validation, and extensibility.
 *
 * Supports:
 * - plain text messages
 * - templated messages (WABA)
 * - metadata for advanced use cases
 */
export class MessagePayloadVO {
  readonly message: string;
  readonly title?: string;
  readonly templateName?: string;
  readonly templateParams?: Record<string, any>;
  readonly metadata?: Record<string, any>;

  private constructor(props: {
    message: string;
    title?: string;
    templateName?: string;
    templateParams?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    this.message = props.message;
    this.title = props.title;
    this.templateName = props.templateName;
    this.templateParams = props.templateParams;
    this.metadata = props.metadata;

    this.validate();
  }

  /**
   * Factory method for creating payload
   */
  static create(props: {
    message: string;
    title?: string;
    templateName?: string;
    templateParams?: Record<string, any>;
    metadata?: Record<string, any>;
  }): MessagePayloadVO {
    return new MessagePayloadVO(props);
  }

  /**
   * Basic validation rules
   */
  private validate() {
    if (!this.message && !this.templateName) {
      throw new Error(
        'Payload must contain either a message or a templateName',
      );
    }

    if (this.templateName && !this.templateParams) {
      throw new Error(
        'Template messages must include templateParams',
      );
    }
  }

  /**
   * Convert to plain object (for persistence or transport)
   */
  toObject() {
    return {
      message: this.message,
      title: this.title,
      templateName: this.templateName,
      templateParams: this.templateParams,
      metadata: this.metadata,
    };
  }
}
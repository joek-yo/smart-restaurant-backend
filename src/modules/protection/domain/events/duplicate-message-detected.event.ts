// src/modules/protection/domain/events/duplicate-message-detected.event.ts

import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * DuplicateMessageDetectedEvent
 * -----------------------------
 * Emitted when an inbound message is identified as a duplicate
 * of a previously processed message.
 *
 * This is a protection-level event used for:
 * → idempotency tracking
 * → retry behavior analysis
 * → webhook duplication detection
 */
export class DuplicateMessageDetectedEvent {

  constructor(
    // Trace of the workflow this message belongs to
    public readonly traceId: WorkflowTraceIdVO,

    // Tenant isolation scope
    public readonly scope: TenantScopeVO,

    // Unique message identifier (external or internal)
    public readonly messageId: string,

    // User who sent the message
    public readonly userId: string,

    // Channel source (whatsapp, sms, api, etc.)
    public readonly channel: string,

    // Reason for duplication detection
    public readonly reason: 'IDEMPOTENCY_HIT' | 'WEBHOOK_RETRY' | 'QUEUE_REDELIVERY',

    // Severity level of duplication impact
    public readonly severity: ProtectionLevel,

    // How many times this message was seen
    public readonly occurrenceCount: number,

    // Whether system ignored processing safely
    public readonly ignored: boolean,

    // Timestamp of detection
    public readonly detectedAt: Date = new Date(),
  ) {}
}
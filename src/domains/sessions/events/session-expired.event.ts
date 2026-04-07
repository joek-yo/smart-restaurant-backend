// 📁 src/domains/sessions/events/session-expired.event.ts

export class SessionExpiredEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
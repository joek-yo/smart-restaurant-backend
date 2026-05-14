export class WorkflowLockId {
  constructor(public readonly value: string) {}
  static generate() { return new WorkflowLockId(Math.random().toString(36)); }
  getValue(): string { return this.value; }
  toString() { return this.value; }
}

export { WorkflowLockId as WorkflowLockIdVO };

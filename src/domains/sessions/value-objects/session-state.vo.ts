// src/domains/sessions/value-objects/session-state.vo.ts

export enum SessionState {
  START = 'START',
  BROWSING_MENU = 'BROWSING_MENU',
  CART_UPDATED = 'CART_UPDATED',
  CHECKOUT = 'CHECKOUT',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export class SessionStateVO {
  private state: SessionState;

  constructor(initialState: SessionState = SessionState.START) {
    this.state = initialState;
  }

  get value(): SessionState {
    return this.state;
  }

  public set(state: SessionState) {
    this.state = state;
  }

  public is(state: SessionState): boolean {
    return this.state === state;
  }
}
// FILE: src/domains/sessions/sessions.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('sessions')
export class SessionController {
  constructor() {}

  @Get()
  test() {
    return { status: 'sessions module working' };
  }
}
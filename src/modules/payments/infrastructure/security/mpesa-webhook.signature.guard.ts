import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class MpesaWebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: verify MPESA signature header
    return true;
  }
}

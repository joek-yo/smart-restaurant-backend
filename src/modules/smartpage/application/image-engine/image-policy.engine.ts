import { Injectable } from '@nestjs/common';
export interface ImagePolicyInput { context?: any; blocks?: any[]; }
@Injectable()
export class ImagePolicyEngine {
  apply(input: any): any { return input; }

  evaluate(_input: ImagePolicyInput): any { return {}; }
}

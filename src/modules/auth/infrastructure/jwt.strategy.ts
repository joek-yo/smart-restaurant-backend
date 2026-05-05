// src/modules/auth/infrastructure/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from '@modules/business/infrastructure/schemas/business.schema';

export interface JwtPayload {
  sub: string;       // businessId
  slug: string;      // tenant slug
  role: string;      // 'owner' | 'staff' | 'customer'
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: JwtPayload) {
    const business = await this.businessModel.findById(payload.sub).exec();
    if (!business || !business.isActive) {
      throw new UnauthorizedException('Business not found or inactive');
    }
    return { businessId: payload.sub, slug: payload.slug, role: payload.role };
  }
}

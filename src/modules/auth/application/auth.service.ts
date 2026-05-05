// src/modules/auth/application/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { Business, BusinessDocument } from '@modules/business/infrastructure/schemas/business.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../infrastructure/jwt.strategy';
import { FEATURE_PRESETS } from '@modules/business/domain/entities/business-features';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.businessModel.findOne({
      $or: [{ email: dto.email }, { slug: dto.slug }],
    }).exec();

    if (existing) throw new ConflictException('Email or slug already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Auto-apply feature preset based on businessType
    const businessType = dto.businessType || 'general';
    const features = FEATURE_PRESETS[businessType] || FEATURE_PRESETS['general'];

    const business = await this.businessModel.create({
      ...dto,
      password: hashedPassword,
      businessType,
      features,
      isActive: true,
    });

    return {
      access_token: this.generateToken(business),
      business: this.toPublic(business),
    };
  }

  async login(dto: LoginDto) {
    const business = await this.businessModel
      .findOne({ email: dto.email })
      .select('+password')
      .exec();

    if (!business) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(
      dto.password,
      (business as any).password || '',
    );

    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      access_token: this.generateToken(business),
      business: this.toPublic(business),
    };
  }

  private generateToken(business: BusinessDocument): string {
    const payload: JwtPayload = {
      sub: (business._id as any).toString(),
      slug: business.slug,
      role: 'owner',
    };
    return this.jwtService.sign(payload);
  }

  private toPublic(business: BusinessDocument) {
    return {
      id: (business._id as any).toString(),
      name: business.name,
      slug: business.slug,
      email: business.email,
      businessType: (business as any).businessType,
      features: (business as any).features,
    };
  }
}

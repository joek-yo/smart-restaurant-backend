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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if slug or email already taken
    const existing = await this.businessModel.findOne({
      $or: [{ email: dto.email }, { slug: dto.slug }],
    }).exec();

    if (existing) {
      throw new ConflictException('Email or slug already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const business = await this.businessModel.create({
      ...dto,
      password: hashedPassword,
      isActive: true,
    });

    const token = this.generateToken(business);

    return {
      access_token: token,
      business: {
        id: (business._id as any).toString(),
        name: business.name,
        slug: business.slug,
        email: business.email,
      },
    };
  }

  async login(dto: LoginDto) {
    const business = await this.businessModel
      .findOne({ email: dto.email })
      .select('+password')
      .exec();

    if (!business) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      (business as any).password || '',
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(business);

    return {
      access_token: token,
      business: {
        id: (business._id as any).toString(),
        name: business.name,
        slug: business.slug,
        email: business.email,
      },
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
}

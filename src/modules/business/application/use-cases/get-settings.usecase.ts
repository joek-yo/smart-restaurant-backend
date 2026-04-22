// src/modules/business/application/use-cases/get-settings.usecase.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  BusinessSettings,
  BusinessSettingsDocument,
} from '../../infrastructure/schemas/business-settings.schema';

@Injectable()
export class GetSettingsUseCase {
  constructor(
    @InjectModel(BusinessSettings.name)
    private readonly settingsModel: Model<BusinessSettingsDocument>,
  ) {}

  async execute(businessId: string) {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new NotFoundException('Invalid Business ID format');
    }

    const settings = await this.settingsModel.findOne({
      businessId: new Types.ObjectId(businessId),
    });

    if (!settings) {
      throw new NotFoundException(`Settings for business ${businessId} not found`);
    }

    return settings;
  }
}
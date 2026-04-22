// src/modules/business/application/use-cases/update-settings.usecase.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  BusinessSettings,
  BusinessSettingsDocument,
} from '../../infrastructure/schemas/business-settings.schema';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    @InjectModel(BusinessSettings.name)
    private readonly settingsModel: Model<BusinessSettingsDocument>,
  ) {}

  async execute(
    businessId: string,
    data: Partial<BusinessSettings>,
  ) {
    const oid = new Types.ObjectId(businessId);

    return this.settingsModel
      .findOneAndUpdate(
        { businessId: oid },
        {
          $set: {
            ...data,
            businessId: oid,
          },
        },
        {
          new: true,
          upsert: true,
        },
      )
      .exec();
  }
}
// src/modules/restaurants/use-cases/update-settings.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  RestaurantSettings,
  RestaurantSettingsDocument,
} from '../schemas/restaurant-settings.schema';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    @InjectModel(RestaurantSettings.name)
    private readonly settingsModel: Model<RestaurantSettingsDocument>,
  ) {}

  async execute(
    businessId: string,
    data: Partial<RestaurantSettings>,
  ) {
    return this.settingsModel.findOneAndUpdate(
      { businessId: new Types.ObjectId(businessId) },
      {
        $set: {
          ...data,
          businessId: new Types.ObjectId(businessId),
        },
      },
      { new: true, upsert: true },
    );
  }
}
// src/modules/restaurants/use-cases/get-settings.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  RestaurantSettings,
  RestaurantSettingsDocument,
} from '../schemas/restaurant-settings.schema';

@Injectable()
export class GetSettingsUseCase {
  constructor(
    @InjectModel(RestaurantSettings.name)
    private readonly settingsModel: Model<RestaurantSettingsDocument>,
  ) {}

  async execute(businessId: string) {
    const settings = await this.settingsModel.findOne({
      businessId: new Types.ObjectId(businessId),
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    return settings;
  }
}
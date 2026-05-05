// src/infrastructure/notifications/database/mongoose/repositories/notification.repository.impl.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from '../notification.schema';

// ✅ STANDARDIZED imports
import { Notification } from '@modules/notifications/entities/notification.entity';
import { NotificationRepository } from '@modules/notifications/repositories/notification.repository';
import { NotificationStatusEnum } from '@modules/notifications/enums/notification-status.enum';

@Injectable()
export class NotificationRepositoryImpl implements NotificationRepository {
  private readonly logger = new Logger(NotificationRepositoryImpl.name);

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const created = new this.notificationModel(notification);
    const result = await created.save();

    this.logger.log(`Notification saved → ${result._id}`);

    return result.toObject() as unknown as Notification;
  }

  async updateStatus(id: string, status: NotificationStatusEnum): Promise<void> {
    await this.notificationModel.updateOne({ _id: id }, { status });
    this.logger.log(`Notification ${id} status updated → ${status}`);
  }

  async incrementRetries(id: string): Promise<void> {
    await this.notificationModel.updateOne({ _id: id }, { $inc: { retries: 1 } });
    this.logger.log(`Notification ${id} retry incremented`);
  }

  async findById(id: string): Promise<Notification | null> {
    const result = await this.notificationModel.findById(id).exec();
    return result ? (result.toObject() as unknown as Notification) : null;
  }
}
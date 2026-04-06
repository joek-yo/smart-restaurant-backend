// src/infrastructure/notifications/database/mongoose/repositories/notification.repository.impl.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from '../notification.schema';

// ✅ Correct 5-level path to domains
import { Notification } from '../../../../../domains/notifications/entities/notification.entity';
import { NotificationRepository } from '../../../../../domains/notifications/repositories/notification.repository';
import { NotificationStatusEnum } from '../../../../../domains/notifications/enums/notification-status.enum';

@Injectable()
export class NotificationRepositoryImpl implements NotificationRepository {
  private readonly logger = new Logger(NotificationRepositoryImpl.name);

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Save notification
   * ✅ Safer type casting via unknown
   */
  async save(notification: Notification): Promise<Notification> {
    const created = new this.notificationModel(notification);
    const result = await created.save();

    this.logger.log(`Notification saved → ${result._id}`);

    // Cast safely to domain entity
    return result.toObject() as unknown as Notification;
  }

  /**
   * Update notification status
   */
  async updateStatus(id: string, status: NotificationStatusEnum): Promise<void> {
    await this.notificationModel.updateOne({ _id: id }, { status });
    this.logger.log(`Notification ${id} status updated → ${status}`);
  }

  /**
   * Increment retries
   */
  async incrementRetries(id: string): Promise<void> {
    await this.notificationModel.updateOne({ _id: id }, { $inc: { retries: 1 } });
    this.logger.log(`Notification ${id} retry incremented`);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const result = await this.notificationModel.findById(id).exec();
    return result ? (result.toObject() as unknown as Notification) : null;
  }
}
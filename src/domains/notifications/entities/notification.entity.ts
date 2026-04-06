// src/domains/notifications/entities/notification.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationStatusEnum } from '../enums/notification-status.enum';
import { NotificationChannelEnum } from '../enums/notification-channel.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { MessagePayloadVO } from '../value-objects/message-payload.vo';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  // 🔹 Expose Mongoose _id as readonly property
  _id!: string; // Add this to fix TS errors

  @Prop({ required: true })
  type!: NotificationTypeEnum;

  @Prop({ required: true })
  channel!: NotificationChannelEnum;

  @Prop({ required: true })
  recipient!: string;

  @Prop({ type: Object, required: true })
  payload!: MessagePayloadVO;

  @Prop({ default: NotificationStatusEnum.PENDING })
  status!: NotificationStatusEnum;

  @Prop({ default: 0 })
  retryCount!: number;

  @Prop()
  lastError?: string;

  // Optional: create a getter for id (readable alias)
  get id(): string {
    return this._id;
  }

  markSent() {
    this.status = NotificationStatusEnum.SENT;
    this.retryCount = 0;
    this.lastError = undefined;
  }

  markFailed(error: string) {
    this.status = NotificationStatusEnum.FAILED;
    this.retryCount += 1;
    this.lastError = error;
  }

  canRetry(maxRetries: number = 3): boolean {
    return this.status === NotificationStatusEnum.FAILED && this.retryCount < maxRetries;
  }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
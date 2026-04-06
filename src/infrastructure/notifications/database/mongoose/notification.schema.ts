// src/infrastructure/notifications/database/mongoose/notification.schema.ts

import { Schema, Document } from 'mongoose';
import { NotificationStatusEnum } from '../../../../domains/notifications/enums/notification-status.enum';
import { NotificationChannelEnum } from '../../../../domains/notifications/enums/notification-channel.enum';
import { NotificationTypeEnum } from '../../../../domains/notifications/enums/notification-type.enum';

export interface NotificationDocument extends Document {
  recipient: string;
  channel: NotificationChannelEnum;
  type: NotificationTypeEnum;
  payload: any;
  status: NotificationStatusEnum;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = new Schema<NotificationDocument>(
  {
    recipient: { type: String, required: true },
    channel: { type: String, enum: Object.values(NotificationChannelEnum), required: true },
    type: { type: String, enum: Object.values(NotificationTypeEnum), required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: Object.values(NotificationStatusEnum), default: NotificationStatusEnum.PENDING },
    retries: { type: Number, default: 0 },
  },
  { timestamps: true },
);
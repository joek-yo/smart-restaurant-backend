import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentLogSchema extends Document {
  @Prop() paymentId!: string;
  @Prop() transactionId?: string;
  @Prop() level!: string;
  @Prop() message!: string;
  @Prop({ type: Object }) context?: Record<string, any>;
  @Prop() provider?: string;
  @Prop() timestamp?: Date;
}

export const PaymentLogModel = SchemaFactory.createForClass(PaymentLogSchema);
export type PaymentLogDocument = PaymentLogSchema & Document;

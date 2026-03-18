import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop()
  address!: string;

  @Prop()
  logo_url!: string;

  @Prop({ required: true })
  timezone!: string;

  @Prop({ required: true })
  currency!: string;

  @Prop({
    type: Object,
    default: { open: '09:00', close: '22:00' },
  })
  business_hours!: {
    open: string;
    close: string;
  };

  @Prop({ default: 'starter' })
  subscription_plan!: string;

  @Prop({ default: true })
  is_active!: boolean;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);


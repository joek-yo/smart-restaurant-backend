import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema() export class SmartPageDocument extends Document {}
export const SmartPageSchema = SchemaFactory.createForClass(SmartPageDocument);

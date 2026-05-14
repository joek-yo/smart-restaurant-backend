import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema() export class SmartPageVersionDocument extends Document {}
export const SmartPageVersionSchema = SchemaFactory.createForClass(SmartPageVersionDocument);

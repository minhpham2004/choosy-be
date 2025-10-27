// Minh Pham and Harry Solterbeck

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'swipes' })
export class Swipe {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  fromUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  toUserId: Types.ObjectId;

  @Prop({ type: String, enum: ['like', 'dislike'], required: true })
  action: 'like' | 'dislike';
}

export type SwipeDoc = HydratedDocument<Swipe>;
export const SwipeSchema = SchemaFactory.createForClass(Swipe);

SwipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

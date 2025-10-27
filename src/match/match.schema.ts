// Minh Pham and Harry Solterbeck

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'matches' })
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userA: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userB: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ type: String, required: true })
  pairKey: string; // `${min(userA)}_${max(userB)}`
}

export type MatchDoc = HydratedDocument<Match>;
export const MatchSchema = SchemaFactory.createForClass(Match);

MatchSchema.index({ pairKey: 1 }, { unique: true });

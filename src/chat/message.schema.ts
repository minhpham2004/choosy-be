//Harry and Minh

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true, index: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  body: string;
}

export type MessageDoc = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);

// For chronological reads
MessageSchema.index({ matchId: 1, createdAt: 1 });

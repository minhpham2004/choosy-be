// Anthony Alexis
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  reportedId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ default: 'pending', enum: ['pending', 'reviewed', 'resolved'] })
  status: string;
}

export type ReportDoc = HydratedDocument<Report>;
export const ReportSchema = SchemaFactory.createForClass(Report);

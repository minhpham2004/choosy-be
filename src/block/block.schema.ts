import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'blocks' })
export class Block {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    blocker: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    blocked: Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
}

export type BlockDoc = HydratedDocument<Block>;
export const BlockSchema = SchemaFactory.createForClass(Block);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User {
    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    })
    email: string;

    @Prop({ trim: true })
    name: string;

    @Prop({ required: true, select: false })
    passwordHash: string;

    @Prop({ type: String, enum: ['active', 'banned'], default: 'active' })
    status: 'active' | 'banned';

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop({ type: Date })
    updatedAt: Date;
}

export type UserDoc = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
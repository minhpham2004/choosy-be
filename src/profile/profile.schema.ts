// Minh Pham & Harry Solterbeck

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileDoc = HydratedDocument<Profile>;

export const INTEREST_KEYS = [
  'sports',
  'music',
  'travel',
  'food',
  'movies',
  'books',
  'gaming',
  'fitness',
  'art',
  'technology',
] as const;

export const AREA_KEYS = [
  'cbd_inner_south',
  'inner_west',
  'eastern_suburbs',
  'lower_north_shore',
  'upper_north_shore',
  'northern_beaches',
  'parramatta_hills',
  'st_george',
  'sutherland_shire',
  'canterbury_bankstown',
  'western_sydney',
  'south_west',
  'outer_west_blue_mountains',
] as const;

export type AreaKey = (typeof AREA_KEYS)[number];
export type InterestKey = (typeof INTEREST_KEYS)[number];

export const DISTANCE_TIERS = ['near', 'mid', 'far'] as const;

@Schema({ timestamps: true, collection: 'profiles' })
export class Profile {
  @Prop({ type: String, required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  age: number;

  @Prop()
  bio: string;

  @Prop({ type: String })
  avatarUrl: string;

  @Prop({
    type: String,
    enum: AREA_KEYS,
    required: true,
  })
  areaKey: string;

  @Prop({ default: true })
  discoverable: boolean;

  @Prop({
    type: [String],
    enum: INTEREST_KEYS,
    default: [],
  })
  interests: string[];

  @Prop({
    type: {
      minAge: { type: Number, required: true, min: 18 },
      maxAge: { type: Number, required: true },
      allowedAreas: { type: [String], enum: AREA_KEYS, default: [] },
      maxDistanceTier: {
        type: String,
        enum: DISTANCE_TIERS,
        default: 'near',
      },
    },
    required: true,
  })
  prefs: {
    minAge: number;
    maxAge: number;
    allowedAreas: string[];
    maxDistanceTier: string;
  };

  @Prop({ type: Date, default: Date.now() })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

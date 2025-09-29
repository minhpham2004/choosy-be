// // src/db/schemas.ts
// // -------------------------------------------------------------
// // All six schemas in one file so migration/seed scripts can import
// // -------------------------------------------------------------
// import { Schema, model, models, Types, InferSchemaType } from 'mongoose';

// // // --- USERS (auth/account) ---
// // export const UserSchema = new Schema(
// //   {
// //     email: { type: String, unique: true, lowercase: true, trim: true, required: true },
// //     passwordHash: { type: String },
// //     profileId: { type: Types.ObjectId, ref: 'Profile', required: false },
// //   },
// //   { timestamps: true }
// // );
// // UserSchema.index({ email: 1 }, { unique: true });
// // UserSchema.index({ profileId: 1 }, { unique: true, sparse: true }); // only if you set it

// // --- PROFILES (what shows in cards & used for matching) ---
// export const ProfileSchema = new Schema(
//   {
//     userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true }, // 1:1 user<->profile
//     displayName: { type: String, required: true },
//     dob: { type: Date }, // optional if you rely on 'age'
//     age: { type: Number, required: true },
//     bio: { type: String },
//     pronouns: { type: String },
//     interests: { type: [String], default: [] }, // keys from interests.key

//     // Sydney-only coarse location, no geospatial
//     areaKey: {
//       type: String,
//       enum: [
//         'cbd_inner_south','inner_west','eastern_suburbs','lower_north_shore','upper_north_shore',
//         'northern_beaches','parramatta_hills','st_george','sutherland_shire','canterbury_bankstown',
//         'western_sydney','south_west','outer_west_blue_mountains'
//       ],
//       required: true,
//     },

//     discoverable: { type: Boolean, default: true },

//     prefs: {
//       minAge: { type: Number, required: true },
//       maxAge: { type: Number, required: true },
//       allowedAreas: { type: [String], default: [] }, // optional explicit allow list
//       maxDistanceTier: { type: String, enum: ['near', 'mid', 'far'], default: 'near' }, // or use tiers
//     },
//   },
//   { timestamps: true }
// );
// ProfileSchema.index({ userId: 1 }, { unique: true });
// ProfileSchema.index({ areaKey: 1 });
// ProfileSchema.index({ discoverable: 1 });
// ProfileSchema.index({ interests: 1 });

// // --- INTERESTS (taxonomy for onboarding & matching) ---
// export const InterestSchema = new Schema(
//   {
//     key: { type: String, unique: true, required: true }, // e.g., 'board_games'
//     label: { type: String, required: true },             // e.g., 'Board Games'
//     category: { type: String },                          // e.g., 'Hobbies'
//   },
//   { timestamps: true }
// );
// InterestSchema.index({ key: 1 }, { unique: true });

// // --- SWIPES (like/dislike history) ---
// export const SwipeSchema = new Schema(
//   {
//     fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
//     toUserId: { type: Types.ObjectId, ref: 'User', required: true },
//     action: { type: String, enum: ['like', 'dislike', 'superlike'], required: true },
//   },
//   { timestamps: true }
// );
// SwipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
// SwipeSchema.index({ toUserId: 1, action: 1, createdAt: -1 });

// // --- MATCHES (mutual-like edges) ---
// export const MatchSchema = new Schema(
//   {
//     userA: { type: Types.ObjectId, ref: 'User', required: true },
//     userB: { type: Types.ObjectId, ref: 'User', required: true },
//     active: { type: Boolean, default: true },
//     lastMessageAt: { type: Date },
//     pairKey: { type: String, unique: true, required: true }, // `${minId}_${maxId}`
//   },
//   { timestamps: true }
// );
// MatchSchema.index({ pairKey: 1 }, { unique: true });
// MatchSchema.index({ lastMessageAt: -1 });

// // --- CONVERSATIONS / MESSAGES (chat; text only) ---
// export const ConversationSchema = new Schema(
//   {
//     matchId: { type: Types.ObjectId, ref: 'Match', unique: true, required: true },
//     participants: { type: [Types.ObjectId], required: true }, // [userA, userB]
//   },
//   { timestamps: true }
// );
// ConversationSchema.index({ matchId: 1 }, { unique: true });

// export const MessageSchema = new Schema(
//   {
//     conversationId: { type: Types.ObjectId, ref: 'Conversation', required: true },
//     senderId: { type: Types.ObjectId, ref: 'User', required: true },
//     body: { type: String, required: true },             // text only (per your simplification)
//     readBy: { type: [Types.ObjectId], default: [] },    // userIds who have read this message
//   },
//   { timestamps: true }
// );
// MessageSchema.index({ conversationId: 1, createdAt: 1 });

// // --- Export Mongoose Models (reuse if already compiled) ---
// // export const UserModel = models.User || model('User', UserSchema);
// export const ProfileModel = models.Profile || model('Profile', ProfileSchema);
// export const InterestModel = models.Interest || model('Interest', InterestSchema);
// export const SwipeModel = models.Swipe || model('Swipe', SwipeSchema);
// export const MatchModel = models.Match || model('Match', MatchSchema);
// export const ConversationModel = models.Conversation || model('Conversation', ConversationSchema);
// export const MessageModel = models.Message || model('Message', MessageSchema);

// // --- Export TypeScript types for the schemas ---
// // export type User = InferSchemaType<typeof UserSchema>;
// export type Profile = InferSchemaType<typeof ProfileSchema>;
// export type Interest = InferSchemaType<typeof InterestSchema>;
// export type Swipe = InferSchemaType<typeof SwipeSchema>;
// export type Match = InferSchemaType<typeof MatchSchema>;
// export type Conversation = InferSchemaType<typeof ConversationSchema>;
// export type Message = InferSchemaType<typeof MessageSchema>;
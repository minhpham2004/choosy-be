// scripts/seed.ts
// -------------------------------------------------------------
// Seeds interests + two users and 1:1 profiles (Sydney-only areas).
// Uses findOne() + save() to avoid weird union return types.
// Run: npm run seed
// -------------------------------------------------------------
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  UserModel,
  ProfileModel,
  InterestModel,
} from '../src/db/schemas';

async function getOrCreateUser(email: string, passwordHash = '<argon2>') {
  // 1) Try to find existing
  let doc = await UserModel.findOne({ email }).exec();
  if (doc) return doc;

  // 2) Create new (avoid Model.create to dodge array | doc typings)
  const newUser = new UserModel({
    email,
    passwordHash,
    roles: [],
    status: 'active',
  });
  return newUser.save(); // always returns a single hydrated doc
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in .env');

  await mongoose.connect(uri);

  // ----- 1) Interests (idempotent) -----------------------------------------
  const interests = [
    { key: 'board_games', label: 'Board Games', category: 'Hobbies' },
    { key: 'hiking',      label: 'Hiking',      category: 'Outdoors' },
    { key: 'gym',         label: 'Gym',         category: 'Health' },
    { key: 'coffee',      label: 'Coffee',      category: 'Food & Drink' },
    { key: 'film',        label: 'Film',        category: 'Arts' },
  ];
  await InterestModel.insertMany(interests, { ordered: false }).catch(() => {});
  console.log('✅ Interests seeded');

  // ----- 2) Users -----------------------------------------------------------
  const aliceDoc = await getOrCreateUser('alice@example.com');
  const bobDoc   = await getOrCreateUser('bob@example.com');

  const aliceId = aliceDoc._id as mongoose.Types.ObjectId;
  const bobId   = bobDoc._id   as mongoose.Types.ObjectId;

  // ----- 3) Profiles (1:1 via unique userId) -------------------------------
  await ProfileModel.updateOne(
    { userId: aliceId },
    {
      $setOnInsert: {
        displayName: 'Alice',
        age: 26,
        interests: ['board_games', 'hiking', 'coffee'],
        areaKey: 'inner_west',
        discoverable: true,
        prefs: { minAge: 20, maxAge: 35, maxDistanceTier: 'near', allowedAreas: [] },
      },
    },
    { upsert: true }
  );

  await ProfileModel.updateOne(
    { userId: bobId },
    {
      $setOnInsert: {
        displayName: 'Bob',
        age: 26,
        interests: ['board_games', 'gym', 'film'],
        areaKey: 'cbd_inner_south',
        discoverable: true,
        prefs: { minAge: 20, maxAge: 35, maxDistanceTier: 'near', allowedAreas: [] },
      },
    },
    { upsert: true }
  );

  console.log('✅ Users & Profiles seeded');
  await mongoose.disconnect();
  console.log('✅ Done');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

// scripts/migrate.ts
// -------------------------------------------------------------
// Creates collections if missing and syncs indexes for all models.
// Run with: npm run migrate
// -------------------------------------------------------------
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  UserModel, ProfileModel, InterestModel, SwipeModel,
  MatchModel, ConversationModel, MessageModel
} from '../src/db/schemas';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in .env');

  // Connect with majority writeConcern; good defaults for index builds
  await mongoose.connect(uri);

  // Order doesn't matter much, but it's nice to log progress
  const models = [
    UserModel, ProfileModel, InterestModel, SwipeModel,
    MatchModel, ConversationModel, MessageModel,
  ];

  for (const m of models) {
    // Ensure collection exists (no-op if already created)
    await m.createCollection().catch(() => {});
    // Build indexes defined in the schemas
    await m.syncIndexes();
    console.log(`✅ Ready: ${m.modelName}`);
  }

  await mongoose.disconnect();
  console.log('All collections & indexes are in sync.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

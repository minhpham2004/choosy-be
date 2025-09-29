import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Swipe, SwipeDoc } from './swipe.schema';
import { Match, MatchDoc } from './match.schema';
import { Profile, ProfileDoc } from 'src/profile/profile.schema';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Swipe.name) private readonly swipeModel: Model<SwipeDoc>,
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDoc>,
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDoc>,
  ) {}

  private recentCache: Map<string, string[]> = new Map(); // userId -> last 5 toUserIds

  async swipe(
    fromUserId: string,
    toUserId: string,
    action: 'like' | 'dislike',
  ) {
    const from = new Types.ObjectId(fromUserId);
    const to = new Types.ObjectId(toUserId);

    // Upsert swipe (one per pair direction)
    const swipe = await this.swipeModel.findOneAndUpdate(
      { fromUserId: from, toUserId: to },
      { fromUserId: from, toUserId: to, action },
      { new: true, upsert: true },
    );

    // Update cache 
    const key = from.toString();
    const arr = this.recentCache.get(key) || [];
    arr.unshift(to.toString()); 
    if (arr.length > 5) arr.pop(); 
    this.recentCache.set(key, arr);

    // Only check for matches if this is a "like"
    if (action === 'like') {
      const reciprocal = await this.swipeModel.findOne({
        fromUserId: to,
        toUserId: from,
        action: 'like',
      });

      if (reciprocal) {
        // Create deterministic pairKey
        const [minId, maxId] = [from.toString(), to.toString()].sort();
        const pairKey = `${minId}_${maxId}`;

        const match = await this.matchModel.findOneAndUpdate(
          { pairKey },
          { userA: minId, userB: maxId, pairKey, active: true },
          { new: true, upsert: true },
        );

        return { swipe, match, matched: true };
      }
    }

    return { swipe, matched: false };
  }

  async getMatches(userId: string) {
    const id = new Types.ObjectId(userId);
    return this.matchModel
      .find({
        $or: [{ userA: id }, { userB: id }],
        active: true,
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findNextCandidate(userId: string) {
    const me = await this.profileModel.findOne({ userId }).lean();
    if (!me) return null;

    // Get IDs of users I already swiped on
    const swipes = await this.swipeModel
      .find({ fromUserId: new Types.ObjectId(userId) })
      .lean();
    const swipedIds = swipes.map((s) => s.toUserId.toString());

    // Also exclude from recent cache
    const recent = this.recentCache.get(userId) || [];

    // Build filter
    const filter: any = {
      discoverable: true,
      userId: { $nin: [userId, ...swipedIds, ...recent] },
      age: { $gte: me.prefs.minAge, $lte: me.prefs.maxAge },
    };

    if (me.prefs.allowedAreas.length > 0) {
      filter.areaKey = { $in: me.prefs.allowedAreas };
    }

    const candidates = await this.profileModel.find(filter).lean();
    if (candidates.length === 0) return null;

    // Score by shared interests
    const scored = candidates.map((c) => {
      const shared = c.interests.filter((i) => me.interests.includes(i));
      return { profile: c, score: shared.length };
    });

    // Sort by score, then random within same score
    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

    const selected = scored[0].profile;

    // Update cache 
    const arr = this.recentCache.get(userId) || [];
    arr.unshift(selected.userId.toString()); // add to front
    if (arr.length > 5) arr.pop(); // keep last 5
    this.recentCache.set(userId, arr);

    return selected;
  }

  async getLikesForUser(userId: string) {
    // Find people who liked me
    const likes = await this.swipeModel
      .find({ toUserId: new Types.ObjectId(userId), action: 'like' })
      .lean();

    const fromUserIds = likes.map((l) => l.fromUserId);

    // Exclude if I already swiped them back (like or dislike)
    const mySwipes = await this.swipeModel
      .find({
        fromUserId: new Types.ObjectId(userId),
        toUserId: { $in: fromUserIds },
      })
      .lean();
    const swipedBackIds = new Set(mySwipes.map((s) => s.toUserId.toString()));

    const pendingIds = fromUserIds.filter(
      (id) => !swipedBackIds.has(id.toString()),
    );

    return this.profileModel.find({ userId: { $in: pendingIds } }).lean();
  }
}

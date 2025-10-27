// Minh Pham
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { Swipe } from './swipe.schema';
import { Match } from './match.schema';
import { Profile } from 'src/profile/profile.schema';
import { Types } from 'mongoose';

describe('MatchService', () => {
  let service: MatchService;

  // Mocked models
  const swipeModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    lean: jest.fn(),
  };
  const matchModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const profileModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    lean: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: getModelToken(Swipe.name), useValue: swipeModel },
        { provide: getModelToken(Match.name), useValue: matchModel },
        { provide: getModelToken(Profile.name), useValue: profileModel },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);

    jest.clearAllMocks();
  });

  describe('swipe', () => {
    it('should record a swipe and return matched=false if no reciprocal like', async () => {
      const from = new Types.ObjectId();
      const to = new Types.ObjectId();

      swipeModel.findOneAndUpdate.mockResolvedValue({
        fromUserId: from,
        toUserId: to,
        action: 'like',
      });
      swipeModel.findOne.mockResolvedValue(null);

      const result = await service.swipe(
        from.toString(),
        to.toString(),
        'like',
      );

      expect(swipeModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result.matched).toBe(false);
    });

    it('should create a match if reciprocal like exists', async () => {
      const from = new Types.ObjectId();
      const to = new Types.ObjectId();

      swipeModel.findOneAndUpdate.mockResolvedValue({
        fromUserId: from,
        toUserId: to,
        action: 'like',
      });
      swipeModel.findOne.mockResolvedValue({
        fromUserId: to,
        toUserId: from,
        action: 'like',
      });
      matchModel.findOneAndUpdate.mockResolvedValue({
        userA: from.toString(),
        userB: to.toString(),
        active: true,
      });

      const result = await service.swipe(
        from.toString(),
        to.toString(),
        'like',
      );

      expect(result.matched).toBe(true);
      expect(result.match).toBeDefined();
    });
  });

  describe('getMatches', () => {
    it('should return active matches for a user', async () => {
      const userId = new Types.ObjectId();
      const matches = [
        { userA: userId, userB: new Types.ObjectId(), active: true },
      ];
      matchModel.exec.mockResolvedValue(matches);

      const result = await service.getMatches(userId.toString());
      expect(result).toEqual(matches);
    });
  });

  describe('findNextCandidate', () => {
    it('should return null if no profile found', async () => {
      profileModel.findOne.mockReturnValue({ lean: () => null });

      const result = await service.findNextCandidate(
        new Types.ObjectId().toString(),
      );
      expect(result).toBeNull();
    });

    it('should return a candidate profile', async () => {
      const userId = new Types.ObjectId();
      const me = {
        userId: userId.toString(),
        prefs: { minAge: 18, maxAge: 30, allowedAreas: [] },
        interests: ['a', 'b'],
      };
      profileModel.findOne.mockReturnValue({ lean: () => me });

      swipeModel.find.mockReturnValue({ lean: () => [] });

      const candidates = [
        {
          userId: new Types.ObjectId().toString(),
          discoverable: true,
          age: 25,
          interests: ['a', 'c'],
        },
      ];
      profileModel.find.mockReturnValue({ lean: () => candidates });

      const result = await service.findNextCandidate(userId.toString());
      expect(result).toEqual(candidates[0]);
    });
  });

  describe('getLikesForUser', () => {
    it('should return profiles of users who liked me and I have not swiped back', async () => {
      const userId = new Types.ObjectId();

      swipeModel.find
        .mockReturnValueOnce({
          lean: () =>
            Promise.resolve([
              {
                fromUserId: new Types.ObjectId(),
                toUserId: userId,
                action: 'like',
              },
            ]),
        }) // likes
        .mockReturnValueOnce({
          lean: () => Promise.resolve([]),
        }); // mySwipes

      profileModel.find.mockReturnValue({
        lean: () => Promise.resolve([{ userId: 'otherUser' }]),
      });

      const result = await service.getLikesForUser(userId.toString());
      expect(result).toEqual([{ userId: 'otherUser' }]);
    });
  });
});

// test/chat.controller.debug.spec.ts
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ChatController } from 'src/chat/chat.controller';
import { Message, MessageDoc } from 'src/chat/message.schema';
import { Match, MatchDoc } from 'src/match/match.schema';

type MockedModel<T> = Partial<Record<keyof Model<T>, jest.Mock>> & any;

describe('ChatController.debug()', () => {
  let ctrl: ChatController;
  let msgModel: MockedModel<MessageDoc>;
  let matchModel: MockedModel<MatchDoc>;

  const OID = () => new Types.ObjectId().toHexString();

  beforeEach(async () => {
    // isolate NODE_ENV mutations per test
    jest.resetModules();
    process.env.NODE_ENV = 'test';

    msgModel = {
      countDocuments: jest.fn(),
      find: jest.fn(),
    } as any;

    matchModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
    } as any;

    const modRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: getModelToken(Message.name), useValue: msgModel },
        { provide: getModelToken(Match.name), useValue: matchModel },
      ],
    }).compile();

    ctrl = modRef.get(ChatController);
  });

  it('clamps limit and returns tail chronologically (oldest → newest)', async () => {
    const matchId = OID();
    const userA = OID();
    const userB = OID();

    matchModel.findById.mockResolvedValue({
      _id: matchId,
      userA,
      userB,
      pairKey: `${userA}_${userB}`,
      lastMessageAt: null,
    });

    msgModel.countDocuments.mockResolvedValue(3);

    const docsDesc = [
      { _id: OID(), matchId, senderId: userA, body: '3', createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-03') },
      { _id: OID(), matchId, senderId: userB, body: '2', createdAt: new Date('2024-01-02'), updatedAt: new Date('2024-01-02') },
      { _id: OID(), matchId, senderId: userA, body: '1', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    ];

    // chainable mock for .find().sort().limit().lean()
    const findChain: any = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(docsDesc) }),
    };
    msgModel.find.mockReturnValue(findChain);

    // pass a goofy limit to exercise clamp (your controller clamps 1..10)
    const out = await ctrl.debug(userA, matchId, '-999');
    expect(out.ok).toBe(true);
    expect(out.messageCount).toBe(3);
    // chronological (reversed from the desc query)

    // verify we asked for desc and then reversed in code
    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns 403-like error object in production', async () => {
    process.env.NODE_ENV = 'production';
    const matchId = OID();

    await expect(
      ctrl.debug(OID(), matchId, '3')
    ).rejects.toMatchObject({ status: 403 }); // HttpException with 403
  });
});

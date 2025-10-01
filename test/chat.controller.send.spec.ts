// test/chat.controller.send.spec.ts
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types, Model } from 'mongoose';

import { ChatController } from 'src/chat/chat.controller';
import { Message, MessageDoc } from 'src/chat/message.schema';
import { Match, MatchDoc } from 'src/match/match.schema';

type MockedModel<T> = Partial<Record<keyof Model<T>, jest.Mock>> & any;

describe('ChatController.send()', () => {
  let ctrl: ChatController;
  let msgModel: MockedModel<MessageDoc>;
  let matchModel: MockedModel<MatchDoc>;

  const OID = () => new Types.ObjectId().toHexString();

  beforeEach(async () => {
    msgModel = { create: jest.fn() } as any;
    matchModel = { updateOne: jest.fn() } as any;

    const modRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: getModelToken(Message.name), useValue: msgModel },
        { provide: getModelToken(Match.name), useValue: matchModel },
      ],
    }).compile();

    ctrl = modRef.get(ChatController);
  });

  it('rejects BAD_MATCH_ID (non-ObjectId)', async () => {
    const res = await ctrl.send(OID(), 'not-an-objectid', { body: 'hello' } as any);
    expect(res).toEqual({ ok: false, error: 'BAD_MATCH_ID' });
    expect(msgModel.create).not.toHaveBeenCalled();
    expect(matchModel.updateOne).not.toHaveBeenCalled();
  });

  it('rejects EMPTY body and does not write', async () => {
    const matchId = OID();
    const res = await ctrl.send(OID(), matchId, { body: '   ' } as any);
    expect(res).toEqual({ ok: false, error: 'EMPTY' });
    expect(msgModel.create).not.toHaveBeenCalled();
    expect(matchModel.updateOne).not.toHaveBeenCalled();
  });

  it('creates message and updates lastMessageAt on success', async () => {
    const matchId = OID();
    const userId = OID();
    const saved = {
      toObject: () => ({
        _id: OID(),
        matchId,
        senderId: userId,
        body: 'hi',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    msgModel.create.mockResolvedValue(saved);
    
    const res = await ctrl.send(userId, matchId, { body: 'hi' } as any);
    expect(res.ok).toBe(true);

    expect(msgModel.create).toHaveBeenCalledWith({
      matchId: new Types.ObjectId(matchId),
      senderId: new Types.ObjectId(userId),
      body: 'hi',
    });

    expect(matchModel.updateOne).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(matchId) },
      { $currentDate: { lastMessageAt: true } },
    );
  });
});

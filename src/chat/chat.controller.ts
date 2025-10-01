import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { GetUserInfo } from 'src/auth/user.decorator';
import { Model, Types } from 'mongoose';
import { Message, MessageDoc } from './message.schema';
import { Match, MatchDoc } from 'src/match/match.schema';

class SendMessageDto { body: string }

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @InjectModel(Message.name) private readonly msgModel: Model<MessageDoc>,
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDoc>,
  ) {}

  // GET /chat/:matchId?limit=50
  @Get(':matchId')
  async list(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Query('limit') limit = '50',
  ) {
    const match = await this.matchModel.findById(matchId).lean();
    if (!match) return [];
    const isMember = [String(match.userA), String(match.userB)].includes(String(userId));
    if (!isMember) return []; // light membership guard for MVP

    return this.msgModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .sort({ createdAt: 1 })
      .limit(Math.max(1, Math.min(200, Number(limit))))
      .lean();
  }

  // POST /chat/:matchId  { body: string }
  @Post(':matchId')
  async send(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Body() dto: SendMessageDto,
  ) {
    const body = dto?.body?.trim();
    if (!body) return { ok: false, error: 'EMPTY' };

    const saved = await this.msgModel.create({
      matchId: new Types.ObjectId(matchId),
      senderId: new Types.ObjectId(userId),
      body,
    });

    // (nice to have) nudge match's lastMessageAt for sorting — optional:
    await this.matchModel.updateOne(
      { _id: new Types.ObjectId(matchId) },
      { $set: { lastMessageAt: saved.createdAt } }
    );

    return { ok: true, message: saved.toObject() };
  }
}

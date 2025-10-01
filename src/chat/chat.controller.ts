import {
  Body, Controller, Get, Param, Post, Query, UseGuards,
  DefaultValuePipe, ParseIntPipe, HttpException, HttpStatus
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { GetUserInfo } from 'src/auth/user.decorator';
import { Model, Types } from 'mongoose';
import { Message, MessageDoc } from './message.schema';
import { Match, MatchDoc } from 'src/match/match.schema';
import { IsString, MinLength, MaxLength } from 'class-validator';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @InjectModel(Message.name) private readonly msgModel: Model<MessageDoc>,
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDoc>,
  ) {}

  // NEW: GET /chat/:matchId?limit=50
  @Get(':matchId')
  async list(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new HttpException('BAD_MATCH_ID', HttpStatus.BAD_REQUEST);
    }

    const m = await this.matchModel.findById(matchId).lean();
    if (!m) return []; // or 404 if you prefer

    const isMember = [String(m.userA), String(m.userB)].includes(String(userId));
    if (!isMember) return []; // or 403 if you prefer

    const lim = Math.max(1, Math.min(200, Number(limit)));
    return this.msgModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .sort({ createdAt: 1 }) // chronological
      .limit(lim)
      .lean();
  }

  @Get(':matchId/_debug')
  async debug(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Query('limit') limit = '3',
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Disabled in production', HttpStatus.FORBIDDEN);
    }

    const m = await this.matchModel.findById(matchId).lean();
    if (!m) {
      return { ok: false, reason: 'MATCH_NOT_FOUND', matchId };
    }

    const isMember = [String(m.userA), String(m.userB)].includes(String(userId));

    const count = await this.msgModel.countDocuments({
      matchId: new Types.ObjectId(matchId),
    });

    const lim = Math.max(1, Math.min(10, Number(limit)));
    const tail = await this.msgModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean();

    tail.reverse();

    return {
      ok: true,
      matchId,
      callerUserId: userId,
      isMember,
      messageCount: count,
      lastMessages: tail,
      match: {
        _id: String(m._id),
        userA: String(m.userA),
        userB: String(m.userB),
        lastMessageAt: m.lastMessageAt ?? null,
        pairKey: m.pairKey,
      },
    };
  }

  @Post(':matchId')
  async send(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Body() dto: SendMessageDto,
  ) {
    const body = dto?.body?.trim();
    if (!body) return { ok: false, error: 'EMPTY' };
    if (!Types.ObjectId.isValid(matchId)) {
      return { ok: false, error: 'BAD_MATCH_ID' };
    }

    // (optional) verify membership first, same as GET

    const saved = await this.msgModel.create({
      matchId: new Types.ObjectId(matchId),
      senderId: new Types.ObjectId(userId),
      body,
    });

    await this.matchModel.updateOne(
      { _id: new Types.ObjectId(matchId) },
      { $currentDate: { lastMessageAt: true } },
    );

    return { ok: true, message: saved.toObject() };
  }
}

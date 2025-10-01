import { Body, Controller, Get, Param, Post, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
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

  // GET /chat/:matchId?limit=50
  @Get(':matchId')
  async list(
    @GetUserInfo('userId') userId: string,
    @Param('matchId') matchId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    try {
      // Validate inputs
      if (!Types.ObjectId.isValid(matchId)) {
        return []; // bad id → empty list (MVP behavior)
      }
      const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));

      // Membership check
      const match = await this.matchModel.findById(matchId).lean();
      if (!match) return [];
      const isMember = [String(match.userA), String(match.userB)].includes(String(userId));
      if (!isMember) return [];

      // Fetch messages
      const msgs = await this.msgModel
        .find({ matchId: new Types.ObjectId(matchId) })
        .sort({ createdAt: 1 })
        .limit(safeLimit)
        .lean();

      return msgs;
    } catch (err) {
      // Don’t 500 the client for simple query issues
      // (you can log err here if you want)
      return [];
    }
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

    if (!Types.ObjectId.isValid(matchId)) {
      return { ok: false, error: 'BAD_MATCH_ID' };
    }

    // Optional: verify membership here too (same as GET)

    const saved = await this.msgModel.create({
      matchId: new Types.ObjectId(matchId),
      senderId: new Types.ObjectId(userId),
      body,
    });

    await this.matchModel.updateOne(
      { _id: new Types.ObjectId(matchId) },
      { $currentDate: { lastMessageAt: true } }
    );

    return { ok: true, message: saved.toObject() };
  }
}

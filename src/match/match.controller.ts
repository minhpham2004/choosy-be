import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MatchService } from './match.service';
import { SwipeDto } from './dtos/swipe.dto';
import { GetUserInfo } from 'src/auth/user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('match')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('/candidate')
  async findNextCandidate(@GetUserInfo('userId') userId: string) {
    return this.matchService.findNextCandidate(userId);
  }

  @Post('swipe')
  async swipe(@GetUserInfo('userId') userId: string, @Body() body: SwipeDto) {
    return this.matchService.swipe(userId, body.toUserId, body.action); // from userId is current user
  }

  @Get('/likes')
  async getLikes(@GetUserInfo('userId') userId: string) {
    return this.matchService.getLikesForUser(userId);
  }

  @Get('/matches')
  async getMatches(@GetUserInfo('userId') userId: string) {
    return this.matchService.getMatches(userId);
  }
}

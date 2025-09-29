import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { Profile, ProfileSchema } from 'src/profile/profile.schema';
import { Swipe, SwipeSchema } from './swipe.schema';
import { Match, MatchSchema } from './match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: Swipe.name, schema: SwipeSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}

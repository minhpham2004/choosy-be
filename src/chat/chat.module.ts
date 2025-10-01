import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from './message.schema';
import { Match, MatchSchema } from 'src/match/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Match.name, schema: MatchSchema }, // used for membership check
    ]),
  ],
  controllers: [ChatController],
})
export class ChatModule {}

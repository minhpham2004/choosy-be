import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { ProfileService } from 'src/profile/profile.service';
import { Profile, ProfileSchema } from 'src/profile/profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  providers: [UserService, ProfileService],
  controllers: [UserController],
  exports: [UserService, MongooseModule],
})
export class UserModule {}

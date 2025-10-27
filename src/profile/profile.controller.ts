// Rayan El-Taher
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './profile.schema';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { GetUserInfo } from 'src/auth/user.decorator';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async create(@Body() body: Partial<Profile>) {
    return this.profileService.create(body);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Get('me')
  async getMyProfile(@GetUserInfo('userId') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Put('')
  async updateMyInfo(
    @GetUserInfo('userId') userId: string,
    @Body() body: Partial<Profile>,
  ) {
    return this.profileService.update(userId, body);
  }

  @Delete(':userId')
  async delete(@Param('userId') userId: string) {
    return this.profileService.delete(userId);
  }

  @Get()
  async listDiscoverable() {
    return this.profileService.listDiscoverable();
  }
}

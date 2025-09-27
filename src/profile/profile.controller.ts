import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './profile.schema';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async create(@Body() body: Partial<Profile>) {
    return this.profileService.create(body);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.profileService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Put(':userId')
  async update(
    @Param('userId') userId: string,
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

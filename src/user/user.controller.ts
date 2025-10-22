// src/user/user.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { GetUserInfo } from 'src/auth/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@GetUserInfo() user: { userId: string }) {
    return this.usersService.findOne(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @GetUserInfo() user: { userId: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@GetUserInfo() user: { userId: string }) {
    return this.usersService.remove(user.userId);
  }

  // --- Existing routes
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('query') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ban/:id')
  ban(@Param('id') id: string) {
    return this.usersService.updateStatus(id, 'banned');
  }

  @UseGuards(JwtAuthGuard)
  @Post('unban/:id')
  unban(@Param('id') id: string) {
    return this.usersService.updateStatus(id, 'active');
  }
}

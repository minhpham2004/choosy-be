// Minh Pham, Nathan Ravasini
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { GetUserInfo } from './user.decorator';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(100) password: string;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(100) newPassword: string;
}

class ReauthDTO {
  @IsString() password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @GetUserInfo() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('reauth')
  reauth(@GetUserInfo() user: { userId: string }, @Body() dto: ReauthDTO) {
    return this.authService.reauth(user.userId, dto.password);
  }
}

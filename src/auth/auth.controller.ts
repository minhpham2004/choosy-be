import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
  
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}

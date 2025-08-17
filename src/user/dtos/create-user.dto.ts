import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  // example rule: at least one letter & one number (tweak as you like)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password: string;
}

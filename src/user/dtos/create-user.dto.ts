import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
} from 'class-validator';
import { AREA_KEYS, AreaKey, INTEREST_KEYS, InterestKey } from 'src/profile/profile.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  // --- Profile fields ---
  @IsInt()
  age: number;

  @IsEnum(AREA_KEYS, { message: 'Invalid areaKey' })
  areaKey: AreaKey;

  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsArray()
  @IsEnum(INTEREST_KEYS, { each: true, message: 'Invalid interest' })
  interests: InterestKey[];
}

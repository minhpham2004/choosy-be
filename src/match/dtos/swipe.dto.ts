// Minh Pham
import { IsString, IsEnum } from 'class-validator';

export class SwipeDto {
  @IsString()
  toUserId: string;

  @IsEnum(['like', 'dislike'])
  action: 'like' | 'dislike';
}

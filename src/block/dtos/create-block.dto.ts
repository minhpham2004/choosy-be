// Anthony Alexis
import { IsMongoId, IsNotEmpty } from 'class-validator';
export class CreateBlockDto {
  @IsMongoId()
  @IsNotEmpty()
  blockedId: string;
}
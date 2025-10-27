// Anthony Alexis
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsMongoId()
  @IsNotEmpty()
  reportedId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
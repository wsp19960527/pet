import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimalStatus } from '@pet/shared';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAnimalStatusDto {
  @ApiProperty({ enum: AnimalStatus })
  @IsEnum(AnimalStatus)
  status!: AnimalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

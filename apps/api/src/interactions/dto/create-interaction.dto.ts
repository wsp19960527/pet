import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionTargetType, InteractionType } from '@pet/shared';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInteractionDto {
  @ApiProperty({ enum: InteractionTargetType })
  @IsEnum(InteractionTargetType)
  targetType!: InteractionTargetType;

  @ApiProperty()
  @IsUUID('4')
  targetId!: string;

  @ApiProperty({ enum: InteractionType })
  @IsEnum(InteractionType)
  type!: InteractionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}

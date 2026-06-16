import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UsageDetailItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amountCents!: number;
}

export class CreateCrowdfundingDto {
  @ApiProperty()
  @IsUUID()
  animalId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ minimum: 1000 })
  @IsInt()
  @Min(1000)
  @Max(10_000_000)
  goalAmountCents!: number;

  @ApiProperty({ type: [UsageDetailItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UsageDetailItemDto)
  usageDetail!: UsageDetailItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class ListCrowdfundingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  animalId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}

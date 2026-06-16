import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnimalSpecies, AnimalStatus } from '@pet/shared';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const DISCOVER_SORT = ['recommend', 'nearby'] as const;
type DiscoverSortValue = (typeof DISCOVER_SORT)[number];

export class DiscoverFeedQueryDto {
  @ApiPropertyOptional({ enum: DISCOVER_SORT, default: 'recommend' })
  @IsOptional()
  @IsEnum(DISCOVER_SORT)
  sort?: DiscoverSortValue = 'recommend';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ enum: AnimalSpecies })
  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @ApiPropertyOptional({ enum: AnimalStatus })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityCode?: string;

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

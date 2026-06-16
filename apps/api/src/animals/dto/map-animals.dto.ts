import { AnimalSpecies, AnimalStatus } from '@pet/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class MapAnimalsQueryDto {
  @ApiPropertyOptional({
    description: 'Bounding box: west,south,east,north (WGS84)',
    example: '116.30,39.85,116.50,40.00',
  })
  @IsString()
  bbox!: string;

  @ApiPropertyOptional({ enum: AnimalStatus })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @ApiPropertyOptional({ enum: AnimalSpecies })
  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize?: number = 100;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityCode?: string;
}

export function parseBbox(bbox: string): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const parts = bbox.split(',').map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('Invalid bbox format');
  }

  const [west, south, east, north] = parts;
  if (west >= east || south >= north) {
    throw new Error('Invalid bbox bounds');
  }

  return { west, south, east, north };
}

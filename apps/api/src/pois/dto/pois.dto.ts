import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { MapPoiType } from '@pet/shared';
import { Type } from 'class-transformer';

export class MapPoisQueryDto {
  @IsString()
  bbox!: string;

  @IsOptional()
  @IsEnum(MapPoiType)
  type?: MapPoiType;

  @IsOptional()
  @IsString()
  cityCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

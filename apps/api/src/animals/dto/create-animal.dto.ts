import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimalSpecies, CoordinateSystem } from '@pet/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAnimalDto {
  @ApiProperty({ enum: AnimalSpecies })
  @IsEnum(AnimalSpecies)
  species!: AnimalSpecies;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ enum: CoordinateSystem, default: CoordinateSystem.GCJ02 })
  @IsOptional()
  @IsEnum(CoordinateSystem)
  coordinateSystem?: CoordinateSystem;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressText?: string;

  @ApiProperty()
  @IsString()
  cityCode!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(9)
  @IsUUID('4', { each: true })
  mediaIds!: string[];
}

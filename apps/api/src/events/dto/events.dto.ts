import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  cityCode!: string;

  @Type(() => Number)
  latitude!: number;

  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class ListEventsQueryDto {
  @IsOptional()
  @IsString()
  cityCode?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  cityCode!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class ListOrganizationsQueryDto {
  @IsOptional()
  @IsString()
  cityCode?: string;
}

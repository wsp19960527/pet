import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@pet.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123456' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AdminRefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

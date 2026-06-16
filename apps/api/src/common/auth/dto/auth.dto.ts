import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: 'Invalid phone number' })
  phone!: string;
}

export class LoginDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: 'Invalid phone number' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(4)
  code!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

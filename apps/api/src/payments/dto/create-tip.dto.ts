import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentChannel, PaymentRefType } from '@pet/shared';
import { IsEnum, IsInt, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateTipDto {
  @ApiProperty({ enum: PaymentRefType })
  @IsEnum(PaymentRefType)
  targetType!: PaymentRefType;

  @ApiProperty()
  @IsUUID()
  targetId!: string;

  @ApiProperty({ description: 'Amount in cents', minimum: 100, maximum: 100000 })
  @IsInt()
  @Min(100)
  @Max(100_000)
  amountCents!: number;

  @ApiProperty({ enum: PaymentChannel })
  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;

  @ApiProperty({ description: 'Client-generated idempotency key' })
  @IsString()
  @MinLength(8)
  idempotencyKey!: string;
}

export class TransparencyQueryDto {
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  pageSize?: number = 20;
}

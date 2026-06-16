import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MOCK_SMS_CODE } from '@pet/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { BadgeService } from '../../badges/badge.service';
import { LoginDto, RefreshTokenDto, SendSmsDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TokenService } from './token.service';
import type { JwtPayload } from '@pet/shared';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly badges: BadgeService,
  ) {}

  @Post('sms/send')
  sendSms(@Body() dto: SendSmsDto) {
    // Mock SMS — always succeeds in development
    return {
      data: {
        phone: dto.phone,
        message: `Mock SMS sent. Use code ${MOCK_SMS_CODE}`,
      },
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    if (dto.code !== MOCK_SMS_CODE) {
      throw new UnauthorizedException('Invalid verification code');
    }

    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          nickname: `用户${dto.phone.slice(-4)}`,
        },
      });
    }

    if (user.status === 'banned') {
      throw new UnauthorizedException('Account banned');
    }

    const tokens = await this.tokenService.issueTokens(
      user.id,
      'user',
      user.role,
    );
    return {
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.tokenService.refresh(dto.refreshToken);
    return { data: tokens };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() payload: JwtPayload) {
    if (payload.type !== 'user') {
      throw new UnauthorizedException('User token required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [reportCount, subscriptionCount, cloudAdoptionCount, badges] =
      await Promise.all([
        this.prisma.animal.count({ where: { creatorId: user.id } }),
        this.prisma.subscription.count({ where: { userId: user.id } }),
        this.prisma.cloudAdoption.count({ where: { userId: user.id } }),
        this.badges.listForUser(user.id),
      ]);

    return {
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        cityCode: user.cityCode,
        reportCount,
        subscriptionCount,
        cloudAdoptionCount,
        badgeCount: badges.length,
        badges,
      },
    };
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { AdminRole } from '@pet/shared';
import type { JwtPayload } from '@pet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../common/auth/token.service';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { AdminLoginDto, AdminRefreshDto } from './dto/admin-auth.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { RequireAdminRoles } from './decorators/require-admin-roles.decorator';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@ApiTags('admin-auth')
@Controller('admin/api/v1/auth')
export class AdminAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.tokenService.issueTokens(
      admin.id,
      'admin',
      admin.role,
    );

    return {
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        ...tokens,
      },
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: AdminRefreshDto) {
    const tokens = await this.tokenService.refresh(dto.refreshToken);
    return { data: tokens };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() payload: JwtPayload) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return {
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        scopes: admin.scopes,
      },
    };
  }

  @Get('dashboard/stats')
  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @RequireAdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPS_ADMIN,
    AdminRole.CITY_ADMIN,
  )
  @ApiBearerAuth()
  async dashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [userCount, adminCount, pendingModeration, todayReports] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.adminUser.count({ where: { status: 'active' } }),
        this.prisma.animal.count({
          where: { moderationStatus: 'pending' },
        }),
        this.prisma.animal.count({
          where: { createdAt: { gte: startOfDay } },
        }),
      ]);

    return {
      data: {
        userCount,
        adminCount,
        pendingModeration,
        pendingReports: 0,
        todayReports,
      },
    };
  }
}

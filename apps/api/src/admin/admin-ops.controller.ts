import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@pet/shared';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { RequireAdminRoles } from './decorators/require-admin-roles.decorator';
import {
  AdminAnimalsService,
  AdminModerationService,
  AdminUsersService,
} from './admin-ops.service';
import { BanUserDto, ModerationDecisionDto } from './dto/admin-ops.dto';

const OPS_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.OPS_ADMIN,
  AdminRole.CITY_ADMIN,
] as const;

@ApiTags('admin-moderation')
@Controller('admin/api/v1/moderation')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminModerationController {
  constructor(private readonly moderation: AdminModerationService) {}

  @Get('queue')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Pending animal moderation queue' })
  queue() {
    return this.moderation.queue();
  }

  @Post('animals/:id/decision')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Approve or reject pending animal' })
  decide(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ModerationDecisionDto,
  ) {
    return this.moderation.decide(admin.sub, id, dto.action, dto.reason);
  }
}

@ApiTags('admin-animals')
@Controller('admin/api/v1/animals')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminAnimalsController {
  constructor(private readonly animals: AdminAnimalsService) {}

  @Get()
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'List animals with filters' })
  list(
    @Query('moderationStatus') moderationStatus?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.animals.list({
      moderationStatus,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Patch(':id/remove')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Force remove animal from public' })
  remove(@CurrentUser() admin: JwtPayload, @Param('id') id: string) {
    return this.animals.remove(admin.sub, id);
  }
}

@ApiTags('admin-users')
@Controller('admin/api/v1/users')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'List app users' })
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.users.list(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Patch(':id/status')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Ban or unban user' })
  setStatus(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.users.setStatus(admin.sub, id, dto.status);
  }
}

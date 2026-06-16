import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@pet/shared';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { RequireAdminRoles } from './decorators/require-admin-roles.decorator';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminSocialService } from './admin-social.service';

const OPS_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.OPS_ADMIN,
  AdminRole.CITY_ADMIN,
] as const;

@ApiTags('admin-social')
@Controller('admin/api/v1')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminSocialController {
  constructor(private readonly social: AdminSocialService) {}

  @Get('organizations')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'List organizations for review' })
  organizations(@Query('status') status?: string) {
    return this.social.listOrganizations(status as never);
  }

  @Post('organizations/:id/decision')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Approve or reject organization' })
  orgDecision(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; reason?: string },
  ) {
    return this.social.decideOrganization(
      admin.sub,
      id,
      body.action,
      body.reason,
    );
  }

  @Get('pois')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'List map POIs' })
  pois() {
    return this.social.listPois();
  }

  @Post('pois')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'Create map POI' })
  createPoi(
    @Body()
    body: {
      cityCode: string;
      type: 'station' | 'volunteer' | 'hotspot';
      name: string;
      description?: string;
      latitude: number;
      longitude: number;
      addressText?: string;
    },
  ) {
    return this.social.createPoi(body);
  }

  @Get('events')
  @RequireAdminRoles(...OPS_ROLES)
  @ApiOperation({ summary: 'List all events' })
  events() {
    return this.social.listEvents();
  }
}

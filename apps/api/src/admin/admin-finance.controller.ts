import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AdminFinanceService } from './admin-finance.service';

const FINANCE_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FINANCE_AUDITOR,
  AdminRole.OPS_ADMIN,
] as const;

@ApiTags('admin-finance')
@Controller('admin/api/v1/finance')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminFinanceController {
  constructor(private readonly finance: AdminFinanceService) {}

  @Get('ledger')
  @RequireAdminRoles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Donation ledger entries' })
  ledger(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.finance.listLedger(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 50,
    );
  }

  @Get('crowdfunding')
  @RequireAdminRoles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Crowdfunding projects admin list' })
  crowdfunding(
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.finance.listCrowdfunding(status, page ? Number(page) : 1);
  }

  @Get('withdrawals')
  @RequireAdminRoles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Withdrawal review queue' })
  withdrawals(@Query('status') status?: string) {
    return this.finance.listWithdrawals(status);
  }

  @Patch('withdrawals/:id')
  @RequireAdminRoles(AdminRole.SUPER_ADMIN, AdminRole.FINANCE_AUDITOR)
  @ApiOperation({ summary: 'Approve or reject withdrawal' })
  reviewWithdrawal(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; note?: string },
  ) {
    return this.finance.reviewWithdrawal(
      admin.sub,
      id,
      body.action,
      body.note,
    );
  }
}

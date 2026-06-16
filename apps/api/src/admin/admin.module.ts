import { Module } from '@nestjs/common';
import { AuthModule } from '../common/auth/auth.module';
import { AdminAuthController } from './admin-auth.controller';
import {
  AdminAnimalsController,
  AdminModerationController,
  AdminUsersController,
} from './admin-ops.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminSocialController } from './admin-social.controller';
import {
  AdminAnimalsService,
  AdminModerationService,
  AdminUsersService,
} from './admin-ops.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminSocialService } from './admin-social.service';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminAuthController,
    AdminModerationController,
    AdminAnimalsController,
    AdminUsersController,
    AdminFinanceController,
    AdminSocialController,
  ],
  providers: [
    AdminRolesGuard,
    AdminModerationService,
    AdminAnimalsService,
    AdminUsersService,
    AdminFinanceService,
    AdminSocialService,
  ],
})
export class AdminModule {}

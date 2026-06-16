import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('api/v1/subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List my subscriptions' })
  list(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.listByUser(user.sub);
  }

  @Post('animals/:animalId')
  @ApiOperation({ summary: 'Subscribe to an animal' })
  subscribe(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
  ) {
    return this.subscriptionsService.subscribe(user.sub, animalId);
  }

  @Delete('animals/:animalId')
  @ApiOperation({ summary: 'Unsubscribe from an animal' })
  unsubscribe(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
  ) {
    return this.subscriptionsService.unsubscribe(user.sub, animalId);
  }
}

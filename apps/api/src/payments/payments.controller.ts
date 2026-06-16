import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { CreateTipDto } from './dto/create-tip.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('tip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tip or crowdfunding donation order' })
  createTip(@CurrentUser() user: JwtPayload, @Body() dto: CreateTipDto) {
    return this.paymentsService.createTip(user.sub, dto);
  }

  @Post('orders/:id/mock-pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dev: simulate payment success' })
  mockPay(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.paymentsService.mockPayOrder(id, user.sub);
  }

  @Post('webhook/wechat')
  @ApiOperation({ summary: 'WeChat pay webhook (stub)' })
  wechatWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleWechatWebhook(payload);
  }

  @Get('transparency')
  @ApiOperation({ summary: 'Public donation ledger (anonymized)' })
  transparency(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.paymentsService.getTransparency(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }
}

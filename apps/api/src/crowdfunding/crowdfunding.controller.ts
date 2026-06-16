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
import { CrowdfundingService } from './crowdfunding.service';
import {
  CreateCrowdfundingDto,
  ListCrowdfundingQueryDto,
} from './dto/crowdfunding.dto';

@ApiTags('crowdfunding')
@Controller('api/v1/crowdfunding')
export class CrowdfundingController {
  constructor(private readonly crowdfundingService: CrowdfundingService) {}

  @Get()
  @ApiOperation({ summary: 'List active crowdfunding projects' })
  list(@Query() query: ListCrowdfundingQueryDto) {
    return this.crowdfundingService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crowdfunding project detail' })
  getById(@Param('id') id: string) {
    return this.crowdfundingService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create crowdfunding project for an animal' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCrowdfundingDto) {
    return this.crowdfundingService.create(user.sub, dto);
  }
}

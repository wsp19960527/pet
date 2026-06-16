import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../common/auth/decorators/optional-current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/auth/guards/optional-jwt-auth.guard';
import { CreateOrganizationDto } from './dto/organizations.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('api/v1/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List approved organizations' })
  list(@Query('cityCode') cityCode?: string) {
    return this.organizationsService.list({ cityCode });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Organization detail' })
  detail(
    @Param('id') id: string,
    @OptionalCurrentUser() viewer: JwtPayload | null,
  ) {
    return this.organizationsService.getById(id, viewer?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to register an organization' })
  apply(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.apply(user.sub, dto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../common/auth/decorators/optional-current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/auth/guards/optional-jwt-auth.guard';
import { CreateEventDto } from './dto/events.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List upcoming published events' })
  list(
    @Query('cityCode') cityCode?: string,
    @Query('organizationId') organizationId?: string,
    @OptionalCurrentUser() viewer: JwtPayload | null = null,
  ) {
    return this.eventsService.list({
      cityCode,
      organizationId,
      viewerId: viewer?.sub,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Event detail' })
  detail(
    @Param('id') id: string,
    @OptionalCurrentUser() viewer: JwtPayload | null,
  ) {
    return this.eventsService.getById(id, viewer?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event (org admin)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.sub, dto);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for event' })
  register(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.eventsService.register(user.sub, id);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel event registration' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.eventsService.cancelRegistration(user.sub, id);
  }
}

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
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../common/auth/decorators/optional-current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/auth/guards/optional-jwt-auth.guard';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { MapAnimalsQueryDto } from './dto/map-animals.dto';
import { UpdateAnimalStatusDto } from './dto/update-animal-status.dto';

@ApiTags('animals')
@Controller('api/v1/animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get('map')
  @ApiOperation({ summary: 'Map viewport query (bbox on lat/lng)' })
  map(@Query() query: MapAnimalsQueryDto) {
    return this.animalsService.findInMapViewport(query);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Rescue status timeline' })
  timeline(@Param('id') id: string) {
    return this.animalsService.getTimeline(id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Animal detail (fuzzy location for public)' })
  detail(
    @Param('id') id: string,
    @OptionalCurrentUser() viewer: JwtPayload | null,
  ) {
    return this.animalsService.getById(id, viewer ?? undefined);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a stray animal' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAnimalDto) {
    return this.animalsService.create(user.sub, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rescue status (state machine)' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAnimalStatusDto,
  ) {
    return this.animalsService.updateStatus(id, user, dto);
  }
}

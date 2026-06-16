import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MapPoisQueryDto } from './dto/pois.dto';
import { PoisService } from './pois.service';

@ApiTags('pois')
@Controller('api/v1/pois')
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  @Get('map')
  @ApiOperation({ summary: 'Map POI viewport query' })
  map(@Query() query: MapPoisQueryDto) {
    return this.poisService.findInViewport(query);
  }
}

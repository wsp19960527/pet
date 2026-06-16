import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';

@ApiTags('cities')
@Controller('api/v1/cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List enabled cities' })
  list() {
    return this.citiesService.listEnabled();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get city center and default zoom' })
  get(@Param('code') code: string) {
    return this.citiesService.findByCode(code);
  }
}

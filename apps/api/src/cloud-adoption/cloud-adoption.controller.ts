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
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { CloudAdoptionService } from './cloud-adoption.service';
import {
  CreateBlessingDto,
  CreateCareUpdateDto,
  RecommendQueryDto,
} from './dto/cloud-adoption.dto';

@ApiTags('cloud-adoption')
@Controller('api/v1')
export class CloudAdoptionController {
  constructor(private readonly cloudAdoption: CloudAdoptionService) {}

  @Get('cloud-adoptions/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my cloud adoptions' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.cloudAdoption.listMine(user.sub);
  }

  @Get('cloud-adoptions/recommend')
  @ApiOperation({ summary: 'Recommend animals for cloud adoption' })
  recommend(@Query() query: RecommendQueryDto) {
    return this.cloudAdoption.recommend(query.page, query.pageSize);
  }

  @Post('cloud-adoptions/animals/:animalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  adopt(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.cloudAdoption.adopt(user.sub, animalId);
  }

  @Delete('cloud-adoptions/animals/:animalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.cloudAdoption.cancel(user.sub, animalId);
  }

  @Get('animals/:id/care-updates')
  @ApiOperation({ summary: 'List care updates for an animal' })
  careUpdates(@Param('id') id: string) {
    return this.cloudAdoption.listCareUpdates(id);
  }

  @Post('animals/:id/care-updates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCareUpdate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateCareUpdateDto,
  ) {
    return this.cloudAdoption.createCareUpdate(user.sub, id, dto);
  }

  @Get('animals/:id/blessings')
  @ApiOperation({ summary: 'List blessings for an animal' })
  blessings(@Param('id') id: string) {
    return this.cloudAdoption.listBlessings(id);
  }

  @Post('animals/:id/blessings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createBlessing(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateBlessingDto,
  ) {
    return this.cloudAdoption.createBlessing(user.sub, id, dto);
  }

  @Get('animals/:id/growth-archive')
  @ApiOperation({ summary: 'Growth archive summary (shareable)' })
  growthArchive(@Param('id') id: string) {
    return this.cloudAdoption.getGrowthArchive(id);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardQueryDto } from '../cloud-adoption/dto/cloud-adoption.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('api/v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('donations')
  @ApiOperation({ summary: 'City donation leaderboard (week/month)' })
  donations(@Query() query: LeaderboardQueryDto) {
    return this.leaderboard.getDonationLeaderboard(query.cityCode, query.period);
  }
}

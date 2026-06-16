import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiscoverFeedQueryDto } from './dto/discover-feed.dto';
import { ActivityFeedQueryDto } from '../cloud-adoption/dto/cloud-adoption.dto';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('api/v1/feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('discover')
  @ApiOperation({ summary: 'Discover feed (recommend / nearby)' })
  discover(@Query() query: DiscoverFeedQueryDto) {
    return this.feedService.discover(query);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent activity feed (status / care / blessings)' })
  activity(@Query() query: ActivityFeedQueryDto) {
    return this.feedService.activity(query);
  }
}

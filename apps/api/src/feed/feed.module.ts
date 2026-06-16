import { Module } from '@nestjs/common';
import { InteractionsModule } from '../interactions/interactions.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [InteractionsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}

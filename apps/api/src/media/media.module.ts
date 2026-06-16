import { Module } from '@nestjs/common';
import { ModerationService } from '../moderation/moderation.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, ModerationService],
  exports: [MediaService, ModerationService],
})
export class MediaModule {}

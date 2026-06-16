import { Module } from '@nestjs/common';
import {
  AnimalInteractionsController,
  InteractionsController,
} from './interactions.controller';
import { InteractionsService } from './interactions.service';

@Module({
  controllers: [InteractionsController, AnimalInteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}

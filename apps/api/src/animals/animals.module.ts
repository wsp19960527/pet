import { Module } from '@nestjs/common';
import { CloudAdoptionModule } from '../cloud-adoption/cloud-adoption.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { MediaModule } from '../media/media.module';
import { PaymentsModule } from '../payments/payments.module';
import { BadgesModule } from '../badges/badges.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';

@Module({
  imports: [
    MediaModule,
    InteractionsModule,
    SubscriptionsModule,
    PaymentsModule,
    BadgesModule,
    CloudAdoptionModule,
  ],
  controllers: [AnimalsController],
  providers: [AnimalsService],
})
export class AnimalsModule {}

import { Module } from '@nestjs/common';
import { BadgesModule } from '../badges/badges.module';
import { PaymentsModule } from '../payments/payments.module';
import { CloudAdoptionController } from './cloud-adoption.controller';
import { CloudAdoptionService } from './cloud-adoption.service';

@Module({
  imports: [BadgesModule, PaymentsModule],
  controllers: [CloudAdoptionController],
  providers: [CloudAdoptionService],
  exports: [CloudAdoptionService],
})
export class CloudAdoptionModule {}

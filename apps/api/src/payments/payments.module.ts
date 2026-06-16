import { Module } from '@nestjs/common';
import { BadgesModule } from '../badges/badges.module';
import { LedgerService } from './ledger.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [BadgesModule],
  controllers: [PaymentsController],
  providers: [LedgerService, PaymentsService],
  exports: [LedgerService, PaymentsService],
})
export class PaymentsModule {}

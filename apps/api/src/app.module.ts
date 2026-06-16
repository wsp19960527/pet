import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AnimalsModule } from './animals/animals.module';
import { AuthModule } from './common/auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { CrowdfundingModule } from './crowdfunding/crowdfunding.module';
import { CloudAdoptionModule } from './cloud-adoption/cloud-adoption.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { BadgesModule } from './badges/badges.module';
import { FeedModule } from './feed/feed.module';
import { HealthModule } from './health/health.module';
import { InteractionsModule } from './interactions/interactions.module';
import { MediaModule } from './media/media.module';
import { EventsModule } from './events/events.module';
import { MessagingModule } from './messaging/messaging.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PoisModule } from './pois/pois.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    AnimalsModule,
    CitiesModule,
    MediaModule,
    InteractionsModule,
    FeedModule,
    SubscriptionsModule,
    PaymentsModule,
    CrowdfundingModule,
    CloudAdoptionModule,
    LeaderboardModule,
    BadgesModule,
    PoisModule,
    OrganizationsModule,
    EventsModule,
    MessagingModule,
  ],
})
export class AppModule {}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const rows = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return rows.map((row) => ({
      code: row.badge.code,
      name: row.badge.name,
      description: row.badge.description,
      icon: row.badge.icon,
      earnedAt: row.earnedAt.toISOString(),
    }));
  }

  async award(userId: string, badgeCode: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode },
    });
    if (!badge) {
      this.logger.warn(`Unknown badge code: ${badgeCode}`);
      return null;
    }

    try {
      const row = await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
        include: { badge: true },
      });
      return row;
    } catch {
      return null;
    }
  }

  async evaluateTipBadges(userId: string) {
    const paidCount = await this.prisma.paymentOrder.count({
      where: { userId, status: 'paid' },
    });
    if (paidCount >= 1) {
      await this.award(userId, 'first_tip');
    }
    if (paidCount >= 10) {
      await this.award(userId, 'tip_master');
    }
  }

  async evaluateRescueBadge(userId: string) {
    const count = await this.prisma.animalStatusLog.count({
      where: { operatorId: userId },
    });
    if (count >= 1) {
      await this.award(userId, 'first_rescue');
    }
  }

  async evaluateCloudParentBadge(userId: string) {
    const count = await this.prisma.cloudAdoption.count({
      where: { userId },
    });
    if (count >= 1) {
      await this.award(userId, 'cloud_parent');
    }
  }

  async evaluateBlessingBadge(userId: string) {
    const count = await this.prisma.blessing.count({ where: { userId } });
    if (count >= 1) {
      await this.award(userId, 'blessing_giver');
    }
  }
}

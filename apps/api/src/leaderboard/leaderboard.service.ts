import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDonationLeaderboard(cityCode?: string, period: 'week' | 'month' = 'week') {
    const days = period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.paymentOrder.groupBy({
      by: ['userId'],
      where: {
        status: 'paid',
        paidAt: { gte: since },
        ...(cityCode ? { user: { cityCode } } : {}),
      },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 20,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.nickname]));

    return {
      data: grouped
        .filter((g) => (g._sum.amountCents ?? 0) > 0)
        .map((row, index) => ({
          rank: index + 1,
          userId: row.userId,
          nickname: userMap.get(row.userId) ?? null,
          score: row._sum.amountCents ?? 0,
          scoreLabel: `¥${((row._sum.amountCents ?? 0) / 100).toFixed(0)}`,
        })),
      meta: { period, cityCode: cityCode ?? null },
    };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(userId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { userId_animalId: { userId, animalId } },
    });
    if (existing) {
      return { data: { subscribed: true, id: existing.id } };
    }

    try {
      const sub = await this.prisma.subscription.create({
        data: { userId, animalId },
      });
      return { data: { subscribed: true, id: sub.id } };
    } catch {
      throw new ConflictException('Already subscribed');
    }
  }

  async unsubscribe(userId: string, animalId: string) {
    await this.prisma.subscription.deleteMany({
      where: { userId, animalId },
    });
    return { data: { subscribed: false } };
  }

  async listByUser(userId: string) {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        animal: {
          select: {
            id: true,
            species: true,
            status: true,
            addressText: true,
          },
        },
      },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        animalId: row.animalId,
        species: row.animal.species,
        status: row.animal.status,
        addressText: row.animal.addressText,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async isSubscribed(userId: string, animalId: string): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId_animalId: { userId, animalId } },
    });
    return Boolean(row);
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.subscription.count({ where: { userId } });
  }
}

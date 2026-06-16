import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnimalStatus } from '@pet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeService } from '../badges/badge.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateBlessingDto, CreateCareUpdateDto } from './dto/cloud-adoption.dto';

@Injectable()
export class CloudAdoptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgeService,
    private readonly payments: PaymentsService,
  ) {}

  async listMine(userId: string) {
    const rows = await this.prisma.cloudAdoption.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        animal: {
          include: {
            city: { select: { name: true } },
            mediaAssets: {
              where: { status: 'approved' },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
            _count: { select: { cloudAdoptions: true } },
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
        coverUrl: row.animal.mediaAssets[0]?.url ?? null,
        cityName: row.animal.city.name,
        cloudParentCount: row.animal._count.cloudAdoptions,
        adoptedAt: row.createdAt.toISOString(),
      })),
    };
  }

  async recommend(page = 1, pageSize = 20) {
    const where = {
      moderationStatus: 'approved' as const,
      status: {
        in: [AnimalStatus.FOSTERING, AnimalStatus.RESCUED, AnimalStatus.AT_VET],
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        orderBy: { viewCount: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          city: { select: { name: true } },
          mediaAssets: {
            where: { status: 'approved' },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: { select: { cloudAdoptions: true } },
        },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      data: rows.map((animal) => ({
        id: animal.id,
        animalId: animal.id,
        species: animal.species,
        status: animal.status,
        coverUrl: animal.mediaAssets[0]?.url ?? null,
        cityName: animal.city.name,
        cloudParentCount: animal._count.cloudAdoptions,
        adoptedAt: animal.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async adopt(userId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const existing = await this.prisma.cloudAdoption.findUnique({
      where: { userId_animalId: { userId, animalId } },
    });
    if (existing) {
      return { data: { adopted: true, id: existing.id } };
    }

    const row = await this.prisma.cloudAdoption.create({
      data: { userId, animalId },
    });
    await this.badges.evaluateCloudParentBadge(userId);

    return { data: { adopted: true, id: row.id } };
  }

  async cancel(userId: string, animalId: string) {
    await this.prisma.cloudAdoption.deleteMany({
      where: { userId, animalId },
    });
    return { data: { adopted: false } };
  }

  async getAnimalSummary(animalId: string, userId?: string) {
    const [count, adopted] = await Promise.all([
      this.prisma.cloudAdoption.count({ where: { animalId } }),
      userId
        ? this.prisma.cloudAdoption.findUnique({
            where: { userId_animalId: { userId, animalId } },
          })
        : Promise.resolve(null),
    ]);
    return {
      cloudParentCount: count,
      cloudAdopted: Boolean(adopted),
    };
  }

  async listCareUpdates(animalId: string) {
    const rows = await this.prisma.careUpdate.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { nickname: true } } },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        animalId: row.animalId,
        content: row.content,
        mediaUrls: (row.mediaUrls as string[]) ?? [],
        authorName: row.author.nickname,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async createCareUpdate(
    userId: string,
    animalId: string,
    dto: CreateCareUpdateDto,
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    if (animal.creatorId !== userId && animal.rescuerId !== userId) {
      throw new ForbiddenException('Only rescuer can publish care updates');
    }

    const row = await this.prisma.careUpdate.create({
      data: {
        animalId,
        authorId: userId,
        content: dto.content.trim(),
        mediaUrls: dto.mediaUrls ?? [],
      },
      include: { author: { select: { nickname: true } } },
    });

    return {
      data: {
        id: row.id,
        animalId: row.animalId,
        content: row.content,
        mediaUrls: (row.mediaUrls as string[]) ?? [],
        authorName: row.author.nickname,
        createdAt: row.createdAt.toISOString(),
      },
    };
  }

  async listBlessings(animalId: string) {
    const rows = await this.prisma.blessing.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true } } },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        animalId: row.animalId,
        content: row.content,
        userNickname: row.user.nickname,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async createBlessing(
    userId: string,
    animalId: string,
    dto: CreateBlessingDto,
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const content = dto.content.trim();
    if (content.length > 200) {
      throw new BadRequestException('Blessing too long');
    }

    const row = await this.prisma.blessing.create({
      data: { userId, animalId, content },
      include: { user: { select: { nickname: true } } },
    });

    await this.badges.evaluateBlessingBadge(userId);

    return {
      data: {
        id: row.id,
        animalId: row.animalId,
        content: row.content,
        userNickname: row.user.nickname,
        createdAt: row.createdAt.toISOString(),
      },
    };
  }

  async getGrowthArchive(animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
      include: { city: { select: { name: true } } },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const [timeline, careUpdates, blessingsCount, tipStats] = await Promise.all([
      this.prisma.animalStatusLog.findMany({
        where: { animalId },
        orderBy: { createdAt: 'asc' },
      }),
      this.listCareUpdates(animalId),
      this.prisma.blessing.count({ where: { animalId } }),
      this.payments.getAnimalTipStats(animalId),
    ]);

    return {
      data: {
        animalId,
        species: animal.species,
        status: animal.status,
        timeline: timeline.map((item) => ({
          status: item.toStatus,
          note: item.note,
          at: item.createdAt.toISOString(),
        })),
        careUpdates: careUpdates.data,
        blessingsCount,
        tipTotalCents: tipStats.tipTotalCents,
        generatedAt: new Date().toISOString(),
        sharePath: `/animals/${animalId}/growth-archive`,
      },
    };
  }
}

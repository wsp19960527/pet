import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async queue() {
    const animals = await this.prisma.animal.findMany({
      where: { moderationStatus: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        creator: { select: { phone: true } },
        mediaAssets: {
          where: { status: { in: ['pending', 'approved'] } },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    });

    return {
      data: animals.map((a) => ({
        id: a.id,
        species: a.species,
        status: a.status,
        moderationStatus: a.moderationStatus,
        description: a.description,
        addressText: a.addressText,
        creatorPhone: a.creator.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        coverUrl: a.mediaAssets[0]?.url ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async decide(
    adminId: string,
    animalId: string,
    action: 'approve' | 'reject',
    reason?: string,
  ) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });
    if (!animal || animal.moderationStatus !== 'pending') {
      throw new NotFoundException('Pending animal not found');
    }

    const moderationStatus = action === 'approve' ? 'approved' : 'rejected';

    await this.prisma.$transaction([
      this.prisma.animal.update({
        where: { id: animalId },
        data: { moderationStatus },
      }),
      this.prisma.mediaAsset.updateMany({
        where: { animalId },
        data: {
          status: action === 'approve' ? 'approved' : 'rejected',
        },
      }),
      this.prisma.auditLog.create({
        data: {
          operatorId: adminId,
          action: `moderation.${action}`,
          targetType: 'animal',
          targetId: animalId,
          payload: { reason: reason ?? null },
        },
      }),
    ]);

    return { data: { id: animalId, moderationStatus } };
  }
}

@Injectable()
export class AdminAnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    moderationStatus?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      ...(params.moderationStatus
        ? { moderationStatus: params.moderationStatus as never }
        : {}),
      ...(params.status ? { status: params.status as never } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          species: true,
          status: true,
          moderationStatus: true,
          cityCode: true,
          addressText: true,
          viewCount: true,
          createdAt: true,
        },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      data: items.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async remove(adminId: string, animalId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    await this.prisma.$transaction([
      this.prisma.animal.update({
        where: { id: animalId },
        data: { moderationStatus: 'removed' },
      }),
      this.prisma.auditLog.create({
        data: {
          operatorId: adminId,
          action: 'animal.remove',
          targetType: 'animal',
          targetId: animalId,
        },
      }),
    ]);

    return { data: { id: animalId, moderationStatus: 'removed' } };
  }
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 20) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { animals: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        phone: u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        nickname: u.nickname,
        role: u.role,
        status: u.status,
        reportCount: u._count.animals,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async setStatus(adminId: string, userId: string, status: 'active' | 'banned') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot ban admin users');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status },
      }),
      this.prisma.auditLog.create({
        data: {
          operatorId: adminId,
          action: `user.${status}`,
          targetType: 'user',
          targetId: userId,
        },
      }),
    ]);

    return { data: { id: userId, status } };
  }
}

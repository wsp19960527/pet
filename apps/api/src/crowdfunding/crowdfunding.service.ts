import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CrowdfundingStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCrowdfundingDto } from './dto/crowdfunding.dto';

@Injectable()
export class CrowdfundingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    animalId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      status: CrowdfundingStatus.active,
      ...(params.animalId ? { animalId: params.animalId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.crowdfundingProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.crowdfundingProject.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toItem(row)),
      meta: { total, page, pageSize },
    };
  }

  async getById(id: string) {
    const row = await this.prisma.crowdfundingProject.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    return { data: this.toItem(row) };
  }

  async create(userId: string, dto: CreateCrowdfundingDto) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: dto.animalId, moderationStatus: 'approved' },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    if (animal.creatorId !== userId && animal.rescuerId !== userId) {
      throw new ForbiddenException('Only creator or rescuer can create crowdfunding');
    }

    const usageTotal = dto.usageDetail.reduce((sum, item) => sum + item.amountCents, 0);
    if (usageTotal !== dto.goalAmountCents) {
      throw new BadRequestException('Usage detail amounts must sum to goal amount');
    }

    const row = await this.prisma.crowdfundingProject.create({
      data: {
        animalId: dto.animalId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        goalAmountCents: dto.goalAmountCents,
        usageDetail: dto.usageDetail as object,
        status: CrowdfundingStatus.active,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });

    return { data: this.toItem(row) };
  }

  private toItem(row: {
    id: string;
    animalId: string;
    title: string;
    description: string | null;
    goalAmountCents: number;
    raisedAmountCents: number;
    usageDetail: unknown;
    status: CrowdfundingStatus;
    deadline: Date | null;
    createdAt: Date;
  }) {
    const progressPercent =
      row.goalAmountCents > 0
        ? Math.min(100, Math.round((row.raisedAmountCents / row.goalAmountCents) * 100))
        : 0;

    return {
      id: row.id,
      animalId: row.animalId,
      title: row.title,
      description: row.description,
      goalAmountCents: row.goalAmountCents,
      raisedAmountCents: row.raisedAmountCents,
      progressPercent,
      usageDetail: row.usageDetail as { label: string; amountCents: number }[],
      status: row.status,
      deadline: row.deadline?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

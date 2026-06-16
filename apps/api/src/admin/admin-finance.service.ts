import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listLedger(page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          wallet: true,
          paymentOrder: {
            include: { user: { select: { phone: true, nickname: true } } },
          },
        },
      }),
      this.prisma.ledgerEntry.count(),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        amountCents: row.amountCents,
        type: row.type,
        refType: row.refType,
        refId: row.refId,
        donorPhone: row.paymentOrder?.user.phone?.replace(
          /(\d{3})\d{4}(\d{4})/,
          '$1****$2',
        ) ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async listCrowdfunding(status?: string, page = 1, pageSize = 20) {
    const where = status ? { status: status as never } : {};
    const [rows, total] = await Promise.all([
      this.prisma.crowdfundingProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { animal: { select: { species: true, cityCode: true } } },
      }),
      this.prisma.crowdfundingProject.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        animalId: row.animalId,
        species: row.animal.species,
        cityCode: row.animal.cityCode,
        goalAmountCents: row.goalAmountCents,
        raisedAmountCents: row.raisedAmountCents,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async listWithdrawals(status?: string) {
    const where = status ? { status: status as never } : {};
    const rows = await this.prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { phone: true, nickname: true } },
      },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        amountCents: row.amountCents,
        status: row.status,
        requesterPhone: row.requester.phone.replace(
          /(\d{3})\d{4}(\d{4})/,
          '$1****$2',
        ),
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async reviewWithdrawal(
    adminId: string,
    id: string,
    action: 'approve' | 'reject',
    note?: string,
  ) {
    const row = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Withdrawal not found');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Withdrawal already reviewed');
    }

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewerId: adminId,
        reviewedAt: new Date(),
        note: note ?? row.note,
      },
    });

    return { data: { id: updated.id, status: updated.status } };
  }
}

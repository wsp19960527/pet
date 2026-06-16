import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerEntryType,
  PaymentChannel,
  PaymentOrderStatus,
  PaymentPurpose,
  WalletOwnerType,
} from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeService } from '../badges/badge.service';
import { LedgerService } from './ledger.service';
import { CreateTipDto } from './dto/create-tip.dto';

const MIN_TIP_CENTS = 100;
const MAX_TIP_CENTS = 100_000;

@Injectable()
export class PaymentsService {
  private readonly mockMode =
    process.env.PAYMENTS_MODE !== 'production';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly badges: BadgeService,
  ) {}

  async createTip(userId: string, dto: CreateTipDto) {
    if (dto.amountCents < MIN_TIP_CENTS || dto.amountCents > MAX_TIP_CENTS) {
      throw new BadRequestException(
        `Amount must be between ${MIN_TIP_CENTS / 100} and ${MAX_TIP_CENTS / 100} yuan`,
      );
    }

    const existing = await this.prisma.paymentOrder.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return this.toOrderResponse(existing);
    }

    const { purpose, refType, refId, walletOwnerId } =
      await this.resolveTarget(dto.targetType, dto.targetId);

    const channel =
      this.mockMode && dto.channel !== PaymentChannel.mock
        ? PaymentChannel.mock
        : dto.channel;

    const order = await this.prisma.paymentOrder.create({
      data: {
        userId,
        amountCents: dto.amountCents,
        channel,
        purpose,
        refType,
        refId,
        idempotencyKey: dto.idempotencyKey,
        metadata: { walletOwnerId },
      },
    });

    return this.toOrderResponse(order);
  }

  async mockPayOrder(orderId: string, userId: string) {
    if (!this.mockMode) {
      throw new BadRequestException('Mock payment is disabled');
    }

    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }

    return this.completeOrder(order.id);
  }

  async handleWechatWebhook(payload: Record<string, unknown>) {
    // Production: verify signature and parse provider order id
    const providerOrderId = String(payload.out_trade_no ?? '');
    if (!providerOrderId) {
      throw new BadRequestException('Invalid webhook payload');
    }

    const order = await this.prisma.paymentOrder.findFirst({
      where: { providerOrderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.completeOrder(order.id);
  }

  async completeOrder(orderId: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === PaymentOrderStatus.paid) {
      return { data: { orderId: order.id, status: order.status } };
    }
    if (order.status !== PaymentOrderStatus.pending) {
      throw new BadRequestException('Order is not payable');
    }

    const walletOwnerId =
      (order.metadata as { walletOwnerId?: string })?.walletOwnerId ??
      order.refId;

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.paymentOrder.updateMany({
        where: { id: orderId, status: PaymentOrderStatus.pending },
        data: {
          status: PaymentOrderStatus.paid,
          paidAt: new Date(),
        },
      });
      if (updated.count === 0) return;

      await this.ledger.creditInTx(tx, {
        ownerType: WalletOwnerType.animal,
        ownerId: walletOwnerId,
        amountCents: order.amountCents,
        type:
          order.purpose === PaymentPurpose.crowdfunding
            ? LedgerEntryType.crowdfunding
            : LedgerEntryType.tip,
        refType: order.refType,
        refId: order.refId,
        paymentOrderId: order.id,
        description:
          order.purpose === PaymentPurpose.crowdfunding
            ? 'Crowdfunding donation'
            : 'Tip donation',
      });

      if (order.purpose === PaymentPurpose.crowdfunding) {
        await tx.crowdfundingProject.update({
          where: { id: order.refId },
          data: { raisedAmountCents: { increment: order.amountCents } },
        });
      }
    });

    const paid = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (paid?.status === PaymentOrderStatus.paid) {
      await this.badges.evaluateTipBadges(paid.userId);
    }

    return { data: { orderId, status: paid?.status ?? PaymentOrderStatus.paid } };
  }

  async getTransparency(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: {
          amountCents: { gt: 0 },
          type: { in: [LedgerEntryType.tip, LedgerEntryType.crowdfunding] },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          paymentOrder: {
            include: {
              user: { select: { phone: true, nickname: true } },
            },
          },
        },
      }),
      this.prisma.ledgerEntry.count({
        where: {
          amountCents: { gt: 0 },
          type: { in: [LedgerEntryType.tip, LedgerEntryType.crowdfunding] },
        },
      }),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => {
        let refLabel = '救助对象';
        if (row.refType === 'animal' && row.refId) {
          const animal = await this.prisma.animal.findUnique({
            where: { id: row.refId },
            include: { city: { select: { name: true } } },
          });
          if (animal) {
            refLabel = `${animal.city.name} · ${animal.species}`;
          }
        } else if (row.refType === 'crowdfunding' && row.refId) {
          const project = await this.prisma.crowdfundingProject.findUnique({
            where: { id: row.refId },
          });
          if (project) {
            refLabel = project.title;
          }
        }

        const phone = row.paymentOrder?.user.phone ?? '';
        const donorLabel = row.paymentOrder?.user.nickname
          ? `${row.paymentOrder.user.nickname.charAt(0)}**`
          : phone
            ? `${phone.slice(0, 3)}****${phone.slice(-2)}`
            : '匿名用户';

        return {
          id: row.id,
          amountCents: row.amountCents,
          type: row.type,
          donorLabel,
          refLabel,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    );

    return {
      data: items,
      meta: { total, page, pageSize },
    };
  }

  async getAnimalTipStats(animalId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        ownerType_ownerId: {
          ownerType: WalletOwnerType.animal,
          ownerId: animalId,
        },
      },
    });

    if (!wallet) {
      return { tipTotalCents: 0, tipCount: 0 };
    }

    const agg = await this.prisma.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: LedgerEntryType.tip,
        amountCents: { gt: 0 },
      },
      _sum: { amountCents: true },
      _count: true,
    });

    return {
      tipTotalCents: agg._sum.amountCents ?? 0,
      tipCount: agg._count,
    };
  }

  private async resolveTarget(targetType: string, targetId: string) {
    if (targetType === 'animal') {
      const animal = await this.prisma.animal.findFirst({
        where: { id: targetId, moderationStatus: 'approved' },
      });
      if (!animal) {
        throw new NotFoundException('Animal not found');
      }
      return {
        purpose: PaymentPurpose.tip,
        refType: 'animal',
        refId: animal.id,
        walletOwnerId: animal.id,
      };
    }

    if (targetType === 'crowdfunding') {
      const project = await this.prisma.crowdfundingProject.findFirst({
        where: { id: targetId, status: 'active' },
      });
      if (!project) {
        throw new NotFoundException('Crowdfunding project not found');
      }
      return {
        purpose: PaymentPurpose.crowdfunding,
        refType: 'crowdfunding',
        refId: project.id,
        walletOwnerId: project.animalId,
      };
    }

    throw new BadRequestException('Invalid target type');
  }

  private toOrderResponse(order: {
    id: string;
    status: PaymentOrderStatus;
    amountCents: number;
    channel: PaymentChannel;
  }) {
    const data: Record<string, unknown> = {
      orderId: order.id,
      status: order.status,
      amountCents: order.amountCents,
      channel: order.channel,
    };

    if (this.mockMode && order.status === PaymentOrderStatus.pending) {
      data.mockPayPath = `/api/v1/payments/orders/${order.id}/mock-pay`;
    }

    return { data };
  }
}

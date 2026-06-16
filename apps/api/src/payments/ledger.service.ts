import { Injectable } from '@nestjs/common';
import {
  LedgerEntryType,
  Prisma,
  WalletOwnerType,
} from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

export interface LedgerCreditInput {
  ownerType: WalletOwnerType;
  ownerId: string;
  amountCents: number;
  type: LedgerEntryType;
  refType?: string;
  refId?: string;
  paymentOrderId?: string;
  description?: string;
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(ownerType: WalletOwnerType, ownerId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { ownerType_ownerId: { ownerType, ownerId } },
    });
    if (existing) return existing;

    return this.prisma.wallet.create({
      data: { ownerType, ownerId },
    });
  }

  async credit(input: LedgerCreditInput) {
    return this.prisma.$transaction((tx) => this.creditInTx(tx, input));
  }

  async creditInTx(tx: Prisma.TransactionClient, input: LedgerCreditInput) {
    if (input.amountCents <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const wallet = await tx.wallet.upsert({
      where: {
        ownerType_ownerId: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
        },
      },
      create: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
      },
      update: {},
    });

    const entry = await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amountCents: input.amountCents,
        type: input.type,
        refType: input.refType,
        refId: input.refId,
        paymentOrderId: input.paymentOrderId,
        description: input.description,
      },
    });

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balanceCents: { increment: input.amountCents } },
    });

    return { entry, wallet: updated };
  }

  async getBalance(ownerType: WalletOwnerType, ownerId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { ownerType_ownerId: { ownerType, ownerId } },
    });
    return wallet?.balanceCents ?? 0;
  }
}

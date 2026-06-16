import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BLOCKED_WORDS = ['诈骗', '赌博'];

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, nickname: true } } },
            },
            participants: {
              include: { user: { select: { id: true, nickname: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const data = await Promise.all(
      participations.map(async (p) => {
        const peer = p.conversation.participants.find(
          (item) => item.userId !== userId,
        );
        const last = p.conversation.messages[0];
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
          },
        });

        return {
          id: p.conversationId,
          peerUserId: peer?.userId ?? '',
          peerNickname: peer?.user.nickname ?? null,
          lastMessage: last?.content ?? null,
          lastMessageAt: last?.createdAt.toISOString() ?? null,
          unreadCount,
        };
      }),
    );

    return { data };
  }

  async startConversation(userId: string, peerUserId: string) {
    if (userId === peerUserId) {
      throw new BadRequestException('Cannot message yourself');
    }

    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId, status: 'active' },
    });
    if (!peer) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: peerUserId } } },
        ],
      },
    });

    if (existing) {
      return { data: { conversationId: existing.id } };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [{ userId }, { userId: peerUserId }],
        },
      },
    });

    return { data: { conversationId: conversation.id } };
  }

  async listMessages(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });

    return {
      data: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        isMine: msg.senderId === userId,
      })),
    };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    await this.assertParticipant(userId, conversationId);

    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (BLOCKED_WORDS.some((word) => trimmed.includes(word))) {
      throw new BadRequestException('Message blocked by moderation');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: userId, content: trimmed },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    return {
      data: {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    };
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('Not a conversation participant');
    }
  }
}

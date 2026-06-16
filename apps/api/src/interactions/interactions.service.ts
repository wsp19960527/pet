import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InteractionTargetType,
  InteractionType,
} from '@pet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInteractionDto) {
    if (dto.targetType !== InteractionTargetType.ANIMAL) {
      throw new BadRequestException('Unsupported target type');
    }

    const animal = await this.prisma.animal.findFirst({
      where: {
        id: dto.targetId,
        moderationStatus: 'approved',
      },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    if (dto.type === InteractionType.COMMENT) {
      const content = dto.content?.trim();
      if (!content) {
        throw new BadRequestException('Comment content is required');
      }

      const comment = await this.prisma.interaction.create({
        data: {
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          type: InteractionType.COMMENT,
          content,
        },
        include: {
          user: { select: { id: true, nickname: true } },
        },
      });

      return {
        data: {
          id: comment.id,
          type: InteractionType.COMMENT,
          content: comment.content,
          userId: comment.userId,
          userNickname: comment.user.nickname,
          createdAt: comment.createdAt.toISOString(),
        },
      };
    }

    if (dto.type === InteractionType.LIKE) {
      const existing = await this.prisma.interaction.findFirst({
        where: {
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          type: InteractionType.LIKE,
        },
      });

      if (existing) {
        await this.prisma.interaction.delete({ where: { id: existing.id } });
        const likeCount = await this.countLikes(dto.targetId);
        return { data: { liked: false, likeCount } };
      }

      try {
        await this.prisma.interaction.create({
          data: {
            userId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            type: InteractionType.LIKE,
          },
        });
      } catch {
        throw new ConflictException('Already liked');
      }

      const likeCount = await this.countLikes(dto.targetId);
      return { data: { liked: true, likeCount } };
    }

    throw new BadRequestException('Unsupported interaction type');
  }

  async listAnimalComments(animalId: string) {
    const comments = await this.prisma.interaction.findMany({
      where: {
        targetType: InteractionTargetType.ANIMAL,
        targetId: animalId,
        type: InteractionType.COMMENT,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    return {
      data: comments.map((item) => ({
        id: item.id,
        type: InteractionType.COMMENT,
        content: item.content,
        userId: item.userId,
        userNickname: item.user.nickname,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async countLikes(animalId: string): Promise<number> {
    return this.prisma.interaction.count({
      where: {
        targetType: InteractionTargetType.ANIMAL,
        targetId: animalId,
        type: InteractionType.LIKE,
      },
    });
  }

  async countComments(animalId: string): Promise<number> {
    return this.prisma.interaction.count({
      where: {
        targetType: InteractionTargetType.ANIMAL,
        targetId: animalId,
        type: InteractionType.COMMENT,
      },
    });
  }

  async isLikedByUser(animalId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    const row = await this.prisma.interaction.findFirst({
      where: {
        userId,
        targetType: InteractionTargetType.ANIMAL,
        targetId: animalId,
        type: InteractionType.LIKE,
      },
    });
    return Boolean(row);
  }
}

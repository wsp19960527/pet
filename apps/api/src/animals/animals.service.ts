import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AnimalStatus } from '@pet/shared';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionsService } from '../interactions/interactions.service';
import { MediaService } from '../media/media.service';
import { ModerationService } from '../moderation/moderation.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from '../payments/payments.service';
import { BadgeService } from '../badges/badge.service';
import { CloudAdoptionService } from '../cloud-adoption/cloud-adoption.service';
import {
  blurAddress,
  canViewPreciseLocation,
  fuzzyCoordinate,
} from './animal-location.util';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { MapAnimalsQueryDto, parseBbox } from './dto/map-animals.dto';
import { UpdateAnimalStatusDto } from './dto/update-animal-status.dto';
import {
  AnimalSpecies,
  CoordinateSystem,
  canTransition,
} from '@pet/shared';
import type { JwtPayload } from '@pet/shared';
import { gcj02ToWgs84 } from '@pet/geo';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly moderation: ModerationService,
    private readonly interactionsService: InteractionsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
    private readonly badgeService: BadgeService,
    private readonly cloudAdoptionService: CloudAdoptionService,
  ) {}

  async findInMapViewport(query: MapAnimalsQueryDto) {
    let bounds: ReturnType<typeof parseBbox>;
    try {
      bounds = parseBbox(query.bbox);
    } catch {
      throw new BadRequestException(
        'bbox must be west,south,east,north (WGS84)',
      );
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 100;

    const where: Prisma.AnimalWhereInput = {
      moderationStatus: 'approved',
      latitude: { gte: bounds.south, lte: bounds.north },
      longitude: { gte: bounds.west, lte: bounds.east },
      ...(query.status
        ? { status: query.status }
        : { status: { notIn: [AnimalStatus.DECEASED, AnimalStatus.ABANDONED] } }),
      ...(query.species ? { species: query.species } : {}),
      ...(query.cityCode ? { cityCode: query.cityCode } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        species: row.species,
        status: row.status,
        latitude: row.latitude,
        longitude: row.longitude,
        addressText: row.addressText,
        viewCount: row.viewCount,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize },
    };
  }

  async create(userId: string, dto: CreateAnimalDto) {
    const city = await this.prisma.city.findFirst({
      where: { code: dto.cityCode, enabled: true },
    });
    if (!city) {
      throw new BadRequestException('Invalid cityCode');
    }

    await this.mediaService.assertOwnedMedia(userId, dto.mediaIds);

    let latitude = dto.latitude;
    let longitude = dto.longitude;
    if ((dto.coordinateSystem ?? CoordinateSystem.GCJ02) === CoordinateSystem.GCJ02) {
      const converted = gcj02ToWgs84(longitude, latitude);
      latitude = converted.latitude;
      longitude = converted.longitude;
    }

    const moderation = this.moderation.reviewAnimalContent(dto.description);
    if (moderation.status === 'rejected') {
      throw new BadRequestException(
        'Content failed moderation review',
      );
    }

    const animal = await this.prisma.animal.create({
      data: {
        creatorId: userId,
        cityCode: dto.cityCode,
        species: dto.species,
        latitude,
        longitude,
        addressText: dto.addressText,
        description: dto.description,
        tags: dto.tags ?? {},
        moderationStatus: moderation.status,
      },
    });

    await this.mediaService.linkToAnimal(animal.id, dto.mediaIds);

    await this.prisma.animalStatusLog.create({
      data: {
        animalId: animal.id,
        fromStatus: null,
        toStatus: animal.status,
        operatorId: userId,
        note: '上报创建',
      },
    });

    return {
      data: {
        id: animal.id,
        moderationStatus: animal.moderationStatus,
        status: animal.status,
      },
    };
  }

  async getById(id: string, viewer?: JwtPayload) {
    const animal = await this.prisma.animal.findFirst({
      where: { id, moderationStatus: 'approved' },
      include: {
        city: true,
        mediaAssets: {
          where: { status: 'approved' },
          orderBy: { sortOrder: 'asc' },
          select: { url: true, sortOrder: true },
        },
      },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    await this.prisma.animal.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const precise = canViewPreciseLocation(
      viewer?.sub,
      animal,
      viewer?.role,
    );

    let latitude = animal.latitude;
    let longitude = animal.longitude;
    let addressText = animal.addressText;

    if (!precise) {
      const fuzzed = fuzzyCoordinate(animal.latitude, animal.longitude, animal.id);
      latitude = fuzzed.latitude;
      longitude = fuzzed.longitude;
      addressText = blurAddress(animal.addressText);
    }

    const [likeCount, commentCount, subscribed, tipStats, cloudSummary] =
      await Promise.all([
        this.interactionsService.countLikes(id),
        this.interactionsService.countComments(id),
        viewer?.sub
          ? this.subscriptionsService.isSubscribed(viewer.sub, id)
          : Promise.resolve(false),
        this.paymentsService.getAnimalTipStats(id),
        this.cloudAdoptionService.getAnimalSummary(id, viewer?.sub),
      ]);

    return {
      data: {
        id: animal.id,
        species: animal.species as AnimalSpecies,
        status: animal.status as AnimalStatus,
        moderationStatus: animal.moderationStatus,
        latitude,
        longitude,
        addressText,
        description: animal.description,
        tags: (animal.tags as Record<string, string>) ?? {},
        viewCount: animal.viewCount + 1,
        likeCount,
        commentCount,
        tipTotalCents: tipStats.tipTotalCents,
        tipCount: tipStats.tipCount,
        cityCode: animal.cityCode,
        cityName: animal.city.name,
        creatorId: animal.creatorId,
        rescuerId: animal.rescuerId,
        locationPrecise: precise,
        subscribed,
        cloudParentCount: cloudSummary.cloudParentCount,
        cloudAdopted: cloudSummary.cloudAdopted,
        media: animal.mediaAssets,
        createdAt: animal.createdAt.toISOString(),
        updatedAt: animal.updatedAt.toISOString(),
      },
    };
  }

  async getTimeline(animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, moderationStatus: 'approved' },
      select: { id: true },
    });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const logs = await this.prisma.animalStatusLog.findMany({
      where: { animalId },
      orderBy: { createdAt: 'asc' },
      include: {
        operator: { select: { nickname: true } },
      },
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        note: log.note,
        operatorName: log.operator.nickname,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  async updateStatus(
    animalId: string,
    user: JwtPayload,
    dto: UpdateAnimalStatusDto,
  ) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });
    if (!animal || animal.moderationStatus !== 'approved') {
      throw new NotFoundException('Animal not found');
    }

    const fromStatus = animal.status as AnimalStatus;
    const toStatus = dto.status;

    if (!canTransition(fromStatus, toStatus)) {
      throw new UnprocessableEntityException(
        `Invalid status transition: ${fromStatus} -> ${toStatus}`,
      );
    }

    const isOrgAdmin =
      user.role === 'org_admin' || user.role === 'admin';
    const isRescuer = animal.rescuerId === user.sub;
    const isCreator = animal.creatorId === user.sub;

    const claimingRescue =
      fromStatus === AnimalStatus.DISCOVERED &&
      toStatus === AnimalStatus.CONTACTING &&
      !animal.rescuerId &&
      isCreator;

    if (!isOrgAdmin && !isRescuer && !claimingRescue) {
      throw new ForbiddenException('Only rescuer can update status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rescuerId = claimingRescue ? user.sub : animal.rescuerId;

      const next = await tx.animal.update({
        where: { id: animalId },
        data: {
          status: toStatus,
          rescuerId,
        },
      });

      await tx.animalStatusLog.create({
        data: {
          animalId,
          fromStatus,
          toStatus,
          note: dto.note,
          operatorId: user.sub,
        },
      });

      return next;
    });

    const subs = await this.prisma.subscription.findMany({
      where: { animalId },
      select: { userId: true },
    });
    if (subs.length > 0) {
      console.log(
        `[push:stub] animal ${animalId} status ${fromStatus} -> ${toStatus}, notify ${subs.length} subscribers`,
      );
    }

    await this.badgeService.evaluateRescueBadge(user.sub);

    return {
      data: {
        id: updated.id,
        status: updated.status as AnimalStatus,
        rescuerId: updated.rescuerId,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { AnimalSpecies, AnimalStatus } from '@pet/shared';
import { haversineDistanceM } from '@pet/geo';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionsService } from '../interactions/interactions.service';
import { blurAddress } from '../animals/animal-location.util';
import { DiscoverFeedQueryDto } from './dto/discover-feed.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interactions: InteractionsService,
  ) {}

  private baseWhere(query: DiscoverFeedQueryDto): Prisma.AnimalWhereInput {
    return {
      moderationStatus: 'approved',
      status: query.status
        ? query.status
        : { notIn: [AnimalStatus.DECEASED, AnimalStatus.ABANDONED] },
      ...(query.species ? { species: query.species } : {}),
      ...(query.cityCode ? { cityCode: query.cityCode } : {}),
    };
  }

  async discover(query: DiscoverFeedQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sort = query.sort ?? 'recommend';

    if (sort === 'nearby' && (query.lat == null || query.lng == null)) {
      throw new BadRequestException('lat and lng required for nearby sort');
    }

    const where = this.baseWhere(query);
    const total = await this.prisma.animal.count({ where });

    let rows = await this.prisma.animal.findMany({
      where,
      include: {
        city: { select: { name: true } },
        mediaAssets: {
          where: { status: 'approved' },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    });

    if (sort === 'nearby') {
      const origin = { latitude: query.lat!, longitude: query.lng! };
      rows = rows
        .map((row) => ({
          row,
          distanceM: haversineDistanceM(origin, {
            latitude: row.latitude,
            longitude: row.longitude,
          }),
        }))
        .sort((a, b) => a.distanceM - b.distanceM)
        .map(({ row }) => row);
    } else {
      rows.sort((a, b) => {
        if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    const paged = rows.slice((page - 1) * pageSize, page * pageSize);
    const lat = query.lat ?? 0;
    const lng = query.lng ?? 0;

    const items = await Promise.all(
      paged.map(async (row) => {
        const [likeCount, commentCount] = await Promise.all([
          this.interactions.countLikes(row.id),
          this.interactions.countComments(row.id),
        ]);
        const distanceM =
          sort === 'nearby'
            ? Math.round(
                haversineDistanceM(
                  { latitude: lat, longitude: lng },
                  { latitude: row.latitude, longitude: row.longitude },
                ),
              )
            : null;

        return {
          id: row.id,
          species: row.species as AnimalSpecies,
          status: row.status as AnimalStatus,
          coverUrl: row.mediaAssets[0]?.url ?? null,
          addressText: blurAddress(row.addressText),
          description: row.description,
          viewCount: row.viewCount,
          likeCount,
          commentCount,
          distanceM,
          cityName: row.city.name,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    );

    return {
      data: items,
      meta: { total, page, pageSize },
    };
  }

  async activity(query: { animalId?: string; pageSize?: number }) {
    const pageSize = query.pageSize ?? 20;
    const animalWhere = query.animalId
      ? { id: query.animalId }
      : { moderationStatus: 'approved' as const };

    const [statusRows, careRows] = await Promise.all([
      this.prisma.animalStatusLog.findMany({
        where: { animal: animalWhere },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(pageSize / 2),
        include: {
          animal: { include: { city: { select: { name: true } } } },
        },
      }),
      this.prisma.careUpdate.findMany({
        where: query.animalId ? { animalId: query.animalId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(pageSize / 2),
        include: {
          animal: { include: { city: { select: { name: true } } } },
        },
      }),
    ]);

    const items = [
      ...statusRows.map((row) => ({
        id: `status-${row.id}`,
        type: 'status_changed' as const,
        animalId: row.animalId,
        animalLabel: `${row.animal.city.name} · ${row.animal.species}`,
        title: `状态更新为 ${row.toStatus}`,
        content: row.note,
        createdAt: row.createdAt.toISOString(),
      })),
      ...careRows.map((row) => ({
        id: `care-${row.id}`,
        type: 'care_update' as const,
        animalId: row.animalId,
        animalLabel: `${row.animal.city.name} · ${row.animal.species}`,
        title: '救助者发布了新动态',
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, pageSize);

    return { data: items };
  }
}

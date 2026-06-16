import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { MapPoisQueryDto } from './dto/pois.dto';

function parseBbox(bbox: string) {
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new BadRequestException('bbox must be west,south,east,north');
  }
  const [west, south, east, north] = parts;
  return { west, south, east, north };
}

@Injectable()
export class PoisService {
  constructor(private readonly prisma: PrismaService) {}

  async findInViewport(query: MapPoisQueryDto) {
    const bounds = parseBbox(query.bbox);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 100;

    const where: Prisma.MapPoiWhereInput = {
      enabled: true,
      latitude: { gte: bounds.south, lte: bounds.north },
      longitude: { gte: bounds.west, lte: bounds.east },
      ...(query.type ? { type: query.type } : {}),
      ...(query.cityCode ? { cityCode: query.cityCode } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.mapPoi.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mapPoi.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        addressText: row.addressText,
        cityCode: row.cityCode,
      })),
      meta: { total, page, pageSize },
    };
  }
}

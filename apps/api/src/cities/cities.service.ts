import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listEnabled() {
    const cities = await this.prisma.city.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        code: true,
        name: true,
        centerLng: true,
        centerLat: true,
        zoom: true,
      },
    });

    return { data: cities };
  }

  async findByCode(code: string) {
    const city = await this.prisma.city.findFirst({
      where: { code, enabled: true },
      select: {
        code: true,
        name: true,
        centerLng: true,
        centerLat: true,
        zoom: true,
      },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    return { data: city };
  }
}

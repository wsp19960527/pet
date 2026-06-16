import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateEventDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
  ) {}

  async list(params: {
    cityCode?: string;
    organizationId?: string;
    viewerId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      status: EventStatus.published,
      startsAt: { gte: new Date() },
      ...(params.cityCode ? { cityCode: params.cityCode } : {}),
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { organization: { select: { name: true } } },
      }),
      this.prisma.event.count({ where }),
    ]);

    let registeredIds = new Set<string>();
    if (params.viewerId && rows.length > 0) {
      const regs = await this.prisma.eventRegistration.findMany({
        where: {
          userId: params.viewerId,
          eventId: { in: rows.map((r) => r.id) },
          status: 'registered',
        },
        select: { eventId: true },
      });
      registeredIds = new Set(regs.map((r) => r.eventId));
    }

    return {
      data: rows.map((row) =>
        this.toItem(row, registeredIds.has(row.id)),
      ),
      meta: { total, page, pageSize },
    };
  }

  async getById(id: string, viewerId?: string) {
    const row = await this.prisma.event.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    });
    if (!row || row.status !== EventStatus.published) {
      throw new NotFoundException('Event not found');
    }

    let registered = false;
    if (viewerId) {
      const reg = await this.prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: { eventId: id, userId: viewerId },
        },
      });
      registered = reg?.status === 'registered';
    }

    return { data: this.toItem(row, registered) };
  }

  async create(userId: string, dto: CreateEventDto) {
    await this.organizations.assertOrgAdmin(userId, dto.organizationId);

    const city = await this.prisma.city.findFirst({
      where: { code: dto.cityCode, enabled: true },
    });
    if (!city) {
      throw new BadRequestException('Invalid cityCode');
    }

    const row = await this.prisma.event.create({
      data: {
        organizationId: dto.organizationId,
        cityCode: dto.cityCode,
        title: dto.title,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        addressText: dto.addressText,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        capacity: dto.capacity ?? 50,
        status: EventStatus.published,
      },
      include: { organization: { select: { name: true } } },
    });

    return { data: this.toItem(row, false) };
  }

  async register(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== EventStatus.published) {
      throw new NotFoundException('Event not found');
    }
    if (event.startsAt < new Date()) {
      throw new BadRequestException('Event already started');
    }
    if (event.registrationCount >= event.capacity) {
      throw new BadRequestException('Event is full');
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing?.status === 'registered') {
      return { data: { registered: true } };
    }

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.eventRegistration.update({
          where: { id: existing.id },
          data: { status: 'registered' },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { registrationCount: { increment: 1 } },
        });
      } else {
        await tx.eventRegistration.create({
          data: { eventId, userId, status: 'registered' },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { registrationCount: { increment: 1 } },
        });
      }
    });

    return { data: { registered: true } };
  }

  async cancelRegistration(userId: string, eventId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!reg || reg.status !== 'registered') {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.$transaction([
      this.prisma.eventRegistration.update({
        where: { id: reg.id },
        data: { status: 'cancelled' },
      }),
      this.prisma.event.update({
        where: { id: eventId },
        data: { registrationCount: { decrement: 1 } },
      }),
    ]);

    return { data: { registered: false } };
  }

  private toItem(
    row: {
      id: string;
      organizationId: string;
      title: string;
      description: string | null;
      latitude: number;
      longitude: number;
      addressText: string | null;
      cityCode: string;
      startsAt: Date;
      endsAt: Date | null;
      capacity: number;
      registrationCount: number;
      status: EventStatus;
      organization: { name: string };
    },
    registered: boolean,
  ) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      title: row.title,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      addressText: row.addressText,
      cityCode: row.cityCode,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      capacity: row.capacity,
      registrationCount: row.registrationCount,
      spotsLeft: Math.max(0, row.capacity - row.registrationCount),
      status: row.status,
      registered,
    };
  }
}

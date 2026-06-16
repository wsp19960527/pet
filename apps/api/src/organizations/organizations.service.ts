import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/organizations.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { cityCode?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      status: OrganizationStatus.approved,
      ...(params.cityCode ? { cityCode: params.cityCode } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { members: true, events: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toItem(row)),
      meta: { total, page, pageSize },
    };
  }

  async getById(id: string, viewerId?: string) {
    const row = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, events: true } },
        members: viewerId
          ? { where: { userId: viewerId }, select: { role: true } }
          : false,
      },
    });
    if (!row || row.status !== OrganizationStatus.approved) {
      throw new NotFoundException('Organization not found');
    }

    const membership = Array.isArray(row.members) ? row.members[0] : undefined;

    return {
      data: {
        ...this.toItem(row),
        isMember: Boolean(membership),
        myRole: membership?.role ?? null,
      },
    };
  }

  async apply(userId: string, dto: CreateOrganizationDto) {
    const city = await this.prisma.city.findFirst({
      where: { code: dto.cityCode, enabled: true },
    });
    if (!city) {
      throw new BadRequestException('Invalid cityCode');
    }

    const row = await this.prisma.organization.create({
      data: {
        creatorId: userId,
        cityCode: dto.cityCode,
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        status: OrganizationStatus.pending,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: { _count: { select: { members: true, events: true } } },
    });

    return { data: this.toItem(row) };
  }

  async assertOrgAdmin(userId: string, organizationId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Organization admin required');
    }
    return member;
  }

  private toItem(row: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    cityCode: string;
    status: OrganizationStatus;
    createdAt: Date;
    _count: { members: number; events: number };
  }) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      logoUrl: row.logoUrl,
      cityCode: row.cityCode,
      status: row.status,
      memberCount: row._count.members,
      eventCount: row._count.events,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

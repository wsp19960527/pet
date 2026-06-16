import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MapPoiType, OrganizationStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSocialService {
  constructor(private readonly prisma: PrismaService) {}

  listOrganizations(status?: OrganizationStatus) {
    return this.prisma.organization.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { nickname: true, phone: true } },
        _count: { select: { members: true, events: true } },
      },
    });
  }

  async decideOrganization(
    adminId: string,
    id: string,
    action: 'approve' | 'reject',
    reason?: string,
  ) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    if (org.status !== OrganizationStatus.pending) {
      throw new BadRequestException('Organization is not pending');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.organization.update({
        where: { id },
        data: {
          status:
            action === 'approve'
              ? OrganizationStatus.approved
              : OrganizationStatus.rejected,
        },
      });
      await tx.auditLog.create({
        data: {
          operatorId: adminId,
          action: `organization.${action}`,
          targetType: 'organization',
          targetId: id,
          payload: reason ? { reason } : undefined,
        },
      });
      return row;
    });

    return { data: updated };
  }

  listPois() {
    return this.prisma.mapPoi.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  createPoi(input: {
    cityCode: string;
    type: MapPoiType;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    addressText?: string;
  }) {
    return this.prisma.mapPoi.create({ data: input });
  }

  listEvents() {
    return this.prisma.event.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
    });
  }
}

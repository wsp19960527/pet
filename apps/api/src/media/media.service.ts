import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MediaStatus } from '@pet/shared';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { ConfirmMediaDto, IssueUploadCredentialDto } from './dto/media.dto';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  private publicBaseUrl(): string {
    return (
      process.env.MEDIA_PUBLIC_BASE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}/uploads`
    );
  }

  private isOssConfigured(): boolean {
    return Boolean(
      process.env.OSS_BUCKET &&
        process.env.OSS_REGION &&
        process.env.OSS_ACCESS_KEY_ID &&
        process.env.OSS_ACCESS_KEY_SECRET,
    );
  }

  issueUploadCredential(userId: string, dto: IssueUploadCredentialDto) {
    const ext = dto.filename.includes('.')
      ? dto.filename.slice(dto.filename.lastIndexOf('.'))
      : '';
    const objectKey = `users/${userId}/${randomUUID()}${ext}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (this.isOssConfigured()) {
      return {
        data: {
          mode: 'oss' as const,
          uploadUrl: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`,
          objectKey,
          publicUrl: `${this.publicBaseUrl()}/${objectKey}`,
          expiresAt,
          headers: {
            'x-oss-object-acl': 'public-read',
          },
        },
      };
    }

    const port = process.env.PORT ?? 3000;
    return {
      data: {
        mode: 'local' as const,
        uploadUrl: `http://localhost:${port}/api/v1/media/upload`,
        objectKey,
        publicUrl: `${this.publicBaseUrl()}/${objectKey}`,
        expiresAt,
      },
    };
  }

  async saveLocalUpload(params: {
    userId: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
  }) {
    if (!params.mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    if (params.sizeBytes > 10 * 1024 * 1024) {
      throw new BadRequestException('Image exceeds 10MB limit');
    }

    const targetPath = join(this.uploadDir, params.objectKey);
    mkdirSync(join(targetPath, '..'), { recursive: true });
    await import('fs/promises').then((fs) =>
      fs.writeFile(targetPath, params.buffer),
    );

    return this.createMediaRecord({
      userId: params.userId,
      objectKey: params.objectKey,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    });
  }

  async confirmUpload(userId: string, dto: ConfirmMediaDto) {
    const existing = await this.prisma.mediaAsset.findUnique({
      where: { objectKey: dto.objectKey },
    });
    if (existing) {
      if (existing.uploaderId !== userId) {
        throw new BadRequestException('Media asset belongs to another user');
      }
      return { data: existing };
    }

    return this.createMediaRecord({
      userId,
      objectKey: dto.objectKey,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      sortOrder: dto.sortOrder,
    });
  }

  private async createMediaRecord(params: {
    userId: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder?: number;
  }) {
    const mediaStatus = this.moderation.reviewMediaAsset();

    const asset = await this.prisma.mediaAsset.create({
      data: {
        uploaderId: params.userId,
        objectKey: params.objectKey,
        url: `${this.publicBaseUrl()}/${params.objectKey}`,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        sortOrder: params.sortOrder ?? 0,
        status: mediaStatus,
      },
    });

    return { data: asset };
  }

  async assertOwnedMedia(userId: string, mediaIds: string[]) {
    if (mediaIds.length === 0) {
      throw new BadRequestException('At least one photo is required');
    }
    if (mediaIds.length > 9) {
      throw new BadRequestException('Maximum 9 photos allowed');
    }

    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: mediaIds }, uploaderId: userId },
    });

    if (assets.length !== mediaIds.length) {
      throw new BadRequestException('Invalid media ids');
    }

    const rejected = assets.find((item) => item.status === 'rejected');
    if (rejected) {
      throw new BadRequestException('One or more images failed moderation');
    }

    return assets;
  }

  async linkToAnimal(animalId: string, mediaIds: string[]) {
    await this.prisma.mediaAsset.updateMany({
      where: { id: { in: mediaIds } },
      data: { animalId },
    });
  }

  async findById(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media not found');
    }
    return asset;
  }
}

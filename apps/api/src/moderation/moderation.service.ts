import { AnimalModerationStatus, MediaStatus } from '@pet/shared';
import { Injectable } from '@nestjs/common';

const TEXT_BLOCKLIST = ['违禁', '赌博', '色情', '诈骗', 'spam', 'violence'];

export interface ModerationResult {
  status: AnimalModerationStatus;
  reason?: string;
}

@Injectable()
export class ModerationService {
  reviewAnimalContent(description?: string | null): ModerationResult {
    const text = description?.trim() ?? '';
    if (!text) {
      return {
        status: AnimalModerationStatus.PENDING,
        reason: 'empty_description',
      };
    }

    const lower = text.toLowerCase();
    for (const word of TEXT_BLOCKLIST) {
      if (lower.includes(word.toLowerCase())) {
        return {
          status: AnimalModerationStatus.REJECTED,
          reason: `blocked_keyword:${word}`,
        };
      }
    }

    if (process.env.AUTO_MODERATE === 'true') {
      return { status: AnimalModerationStatus.APPROVED };
    }

    return { status: AnimalModerationStatus.PENDING };
  }

  reviewMediaAsset(): MediaStatus {
    return process.env.AUTO_MODERATE === 'true'
      ? MediaStatus.APPROVED
      : MediaStatus.PENDING;
  }
}

export interface CloudAdoptionItem {
  id: string;
  animalId: string;
  species: string;
  status: string;
  coverUrl: string | null;
  cityName: string | null;
  cloudParentCount: number;
  adoptedAt: string;
}

export interface CareUpdateItem {
  id: string;
  animalId: string;
  content: string;
  mediaUrls: string[];
  authorName: string | null;
  createdAt: string;
}

export interface BlessingItem {
  id: string;
  animalId: string;
  content: string;
  userNickname: string | null;
  createdAt: string;
}

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadgeItem {
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string | null;
  score: number;
  scoreLabel: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'status_changed' | 'care_update' | 'blessing';
  animalId: string;
  animalLabel: string;
  title: string;
  content: string | null;
  createdAt: string;
}

export interface GrowthArchive {
  animalId: string;
  species: string;
  status: string;
  timeline: { status: string; note: string | null; at: string }[];
  careUpdates: CareUpdateItem[];
  blessingsCount: number;
  tipTotalCents: number;
  generatedAt: string;
  sharePath: string;
}

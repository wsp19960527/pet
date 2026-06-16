export * from './animal-status.js';
export * from './payments.js';
export * from './cloud-adoption.js';
export * from './badges.js';
export * from './social.js';

import type { UserBadgeItem } from './cloud-adoption.js';
export enum AnimalStatus {
  DISCOVERED = 'discovered',
  CONTACTING = 'contacting',
  RESCUED = 'rescued',
  AT_VET = 'at_vet',
  FOSTERING = 'fostering',
  ADOPTED = 'adopted',
  DECEASED = 'deceased',
  ABANDONED = 'abandoned',
}

export enum AnimalSpecies {
  CAT = 'cat',
  DOG = 'dog',
  OTHER = 'other',
}

export enum UserRole {
  USER = 'user',
  RESCUER = 'rescuer',
  ORG_ADMIN = 'org_admin',
  ADMIN = 'admin',
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  OPS_ADMIN = 'ops_admin',
  CITY_ADMIN = 'city_admin',
  ORG_ADMIN = 'org_admin',
  FINANCE_AUDITOR = 'finance_auditor',
  SUPPORT_AGENT = 'support_agent',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

export enum AdminStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum CoordinateSystem {
  WGS84 = 'wgs84',
  GCJ02 = 'gcj02',
}

export enum MediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AnimalModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REMOVED = 'removed',
}

export const API_PREFIX = '/api/v1';
export const ADMIN_API_PREFIX = '/admin/api/v1';

export interface JwtPayload {
  sub: string;
  type: 'user' | 'admin';
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Mock SMS: any phone works; code is always 123456 in development */
export const MOCK_SMS_CODE = '123456';

export interface CityInfo {
  code: string;
  name: string;
  centerLng: number;
  centerLat: number;
  zoom: number;
}

export interface MapAnimalMarker {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  latitude: number;
  longitude: number;
  addressText: string | null;
  viewCount: number;
  createdAt: string;
}

/** Map marker colors from docs/ui-design.md */
export const ANIMAL_MARKER_COLORS: Record<
  | AnimalStatus.DISCOVERED
  | AnimalStatus.CONTACTING
  | AnimalStatus.RESCUED
  | AnimalStatus.AT_VET
  | AnimalStatus.FOSTERING
  | AnimalStatus.ADOPTED,
  string
> = {
  [AnimalStatus.DISCOVERED]: '#E07A5F',
  [AnimalStatus.CONTACTING]: '#F4A261',
  [AnimalStatus.RESCUED]: '#2D6A4F',
  [AnimalStatus.AT_VET]: '#40916C',
  [AnimalStatus.FOSTERING]: '#457B9D',
  [AnimalStatus.ADOPTED]: '#6C757D',
};

export const USER_TOKEN_KEY = 'pet_user_token';
export const PUBLISH_DRAFT_KEY = 'pet_publish_draft';
export const MAX_REPORT_PHOTOS = 9;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export interface MediaUploadCredential {
  mode: 'local' | 'oss';
  uploadUrl: string;
  objectKey: string;
  publicUrl?: string;
  expiresAt: string;
  headers?: Record<string, string>;
}

export interface MediaAssetInfo {
  id: string;
  url: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  status: MediaStatus;
}

export interface CreateAnimalInput {
  species: AnimalSpecies;
  description?: string;
  tags?: Record<string, string>;
  latitude: number;
  longitude: number;
  coordinateSystem?: CoordinateSystem;
  addressText?: string;
  cityCode: string;
  mediaIds: string[];
}

export interface CreatedAnimal {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  moderationStatus: AnimalModerationStatus;
  latitude: number;
  longitude: number;
  addressText: string | null;
  description: string | null;
  cityCode: string;
  createdAt: string;
}

export interface PublishDraft {
  step: number;
  photos: { uri: string; mediaId?: string }[];
  species?: AnimalSpecies;
  description?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  addressText?: string;
  cityCode?: string;
  updatedAt: string;
}

export enum InteractionType {
  COMMENT = 'comment',
  LIKE = 'like',
}

export enum InteractionTargetType {
  ANIMAL = 'animal',
}

export interface AnimalMediaItem {
  id: string;
  url: string;
  sortOrder: number;
}

export interface AnimalDetail {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  moderationStatus: AnimalModerationStatus;
  latitude: number;
  longitude: number;
  addressText: string | null;
  description: string | null;
  tags: Record<string, string>;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tipTotalCents: number;
  tipCount: number;
  cityCode: string;
  cityName: string | null;
  creatorId: string;
  rescuerId: string | null;
  locationPrecise: boolean;
  subscribed?: boolean;
  cloudParentCount: number;
  cloudAdopted?: boolean;
  media: AnimalMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusTimelineItem {
  id: string;
  fromStatus: AnimalStatus | null;
  toStatus: AnimalStatus;
  note: string | null;
  operatorName: string | null;
  createdAt: string;
}

export interface InteractionItem {
  id: string;
  type: InteractionType;
  content: string | null;
  userId: string;
  userNickname: string | null;
  createdAt: string;
}

export interface CreateInteractionInput {
  targetType: InteractionTargetType;
  targetId: string;
  type: InteractionType;
  content?: string;
}

export interface UpdateAnimalStatusInput {
  status: AnimalStatus;
  note?: string;
}

export type DiscoverSort = 'recommend' | 'nearby';

export interface DiscoverFeedItem {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  coverUrl: string | null;
  addressText: string | null;
  description: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  distanceM: number | null;
  cityName: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  nickname: string | null;
  role: string;
  cityCode: string | null;
  reportCount: number;
  subscriptionCount: number;
  cloudAdoptionCount: number;
  badgeCount: number;
  badges: UserBadgeItem[];
}

export interface AdminModerationItem {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  moderationStatus: AnimalModerationStatus;
  description: string | null;
  addressText: string | null;
  creatorPhone: string;
  coverUrl: string | null;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  phone: string;
  nickname: string | null;
  role: string;
  status: UserStatus;
  reportCount: number;
  createdAt: string;
}

export interface AdminAnimalItem {
  id: string;
  species: AnimalSpecies;
  status: AnimalStatus;
  moderationStatus: AnimalModerationStatus;
  cityCode: string;
  addressText: string | null;
  viewCount: number;
  createdAt: string;
}

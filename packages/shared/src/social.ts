export enum MapPoiType {
  STATION = 'station',
  VOLUNTEER = 'volunteer',
  HOTSPOT = 'hotspot',
}

export enum OrganizationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface MapPoiItem {
  id: string;
  type: MapPoiType;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  cityCode: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  cityCode: string;
  status: OrganizationStatus;
  memberCount: number;
  eventCount: number;
  createdAt: string;
}

export interface OrganizationDetail extends OrganizationItem {
  isMember: boolean;
  myRole: string | null;
}

export interface EventItem {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  cityCode: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  registrationCount: number;
  spotsLeft: number;
  status: EventStatus;
  registered: boolean;
}

export interface ConversationItem {
  id: string;
  peerUserId: string;
  peerNickname: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMine: boolean;
}

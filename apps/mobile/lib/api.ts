import type {
  AnimalDetail,
  ApiResponse,
  CityInfo,
  CoordinateSystem,
  CreateAnimalInput,
  CreateInteractionInput,
  CreatedAnimal,
  DiscoverFeedItem,
  DiscoverSort,
  InteractionItem,
  MapAnimalMarker,
  StatusTimelineItem,
  UpdateAnimalStatusInput,
  UserProfile,
} from '@pet/shared';
import { MOCK_SMS_CODE } from '@pet/shared';
import { authHeaders } from './auth';
import { API_BASE } from './config';

export interface LoginResult {
  user: { id: string; phone: string; nickname: string | null; role: string };
  accessToken: string;
  refreshToken: string;
}

export async function loginWithSms(
  phone: string,
  code: string = MOCK_SMS_CODE,
): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '登录失败');
  }
  const json = (await res.json()) as {
    data: LoginResult;
  };
  return json.data;
}

export async function createAnimal(
  input: CreateAnimalInput,
): Promise<ApiResponse<CreatedAnimal>> {
  const res = await fetch(`${API_BASE}/api/v1/animals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({
      ...input,
      coordinateSystem: input.coordinateSystem ?? ('gcj02' as CoordinateSystem),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '上报失败');
  }
  return res.json();
}

export async function fetchCities(): Promise<ApiResponse<CityInfo[]>> {
  const res = await fetch(`${API_BASE}/api/v1/cities`);
  if (!res.ok) {
    throw new Error('Failed to load cities');
  }
  return res.json();
}

export async function fetchMapAnimals(params: {
  bbox: string;
  cityCode?: string;
  pageSize?: number;
}): Promise<ApiResponse<MapAnimalMarker[]>> {
  const search = new URLSearchParams({
    bbox: params.bbox,
    pageSize: String(params.pageSize ?? 200),
  });
  if (params.cityCode) {
    search.set('cityCode', params.cityCode);
  }

  const res = await fetch(`${API_BASE}/api/v1/animals/map?${search}`);
  if (!res.ok) {
    throw new Error('Failed to load map animals');
  }
  return res.json();
}

export function regionToBbox(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): string {
  const south = region.latitude - region.latitudeDelta / 2;
  const north = region.latitude + region.latitudeDelta / 2;
  const west = region.longitude - region.longitudeDelta / 2;
  const east = region.longitude + region.longitudeDelta / 2;
  return `${west},${south},${east},${north}`;
}

export async function fetchAnimalDetail(
  id: string,
): Promise<ApiResponse<AnimalDetail>> {
  const res = await fetch(`${API_BASE}/api/v1/animals/${id}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error('加载详情失败');
  }
  return res.json();
}

export async function fetchAnimalTimeline(
  id: string,
): Promise<ApiResponse<StatusTimelineItem[]>> {
  const res = await fetch(`${API_BASE}/api/v1/animals/${id}/timeline`);
  if (!res.ok) {
    throw new Error('加载时间轴失败');
  }
  return res.json();
}

export async function fetchAnimalComments(
  id: string,
): Promise<ApiResponse<InteractionItem[]>> {
  const res = await fetch(`${API_BASE}/api/v1/animals/${id}/interactions`);
  if (!res.ok) {
    throw new Error('加载评论失败');
  }
  return res.json();
}

export async function postInteraction(
  input: CreateInteractionInput,
): Promise<ApiResponse<InteractionItem | { liked: boolean; likeCount: number }>> {
  const res = await fetch(`${API_BASE}/api/v1/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '操作失败');
  }
  return res.json();
}

export async function updateAnimalStatus(
  id: string,
  input: UpdateAnimalStatusInput,
): Promise<ApiResponse<{ id: string; status: string; rescuerId: string | null }>> {
  const res = await fetch(`${API_BASE}/api/v1/animals/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '状态更新失败');
  }
  return res.json();
}

export async function fetchDiscoverFeed(params: {
  sort?: DiscoverSort;
  lat?: number;
  lng?: number;
  species?: string;
  status?: string;
  cityCode?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<DiscoverFeedItem[]>> {
  const search = new URLSearchParams();
  if (params.sort) search.set('sort', params.sort);
  if (params.lat != null) search.set('lat', String(params.lat));
  if (params.lng != null) search.set('lng', String(params.lng));
  if (params.species) search.set('species', params.species);
  if (params.status) search.set('status', params.status);
  if (params.cityCode) search.set('cityCode', params.cityCode);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE}/api/v1/feed/discover?${search}`);
  if (!res.ok) {
    throw new Error('加载发现页失败');
  }
  return res.json();
}

export async function fetchMe(): Promise<ApiResponse<UserProfile>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error('加载用户信息失败');
  }
  return res.json();
}

export async function subscribeAnimal(animalId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/subscriptions/animals/${animalId}`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '订阅失败');
  }
}

export async function unsubscribeAnimal(animalId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/subscriptions/animals/${animalId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '取消订阅失败');
  }
}

export async function createTip(input: {
  targetType: string;
  targetId: string;
  amountCents: number;
  channel: string;
  idempotencyKey: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/payments/tip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '创建订单失败');
  }
  return res.json();
}

export async function mockPayOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/api/v1/payments/orders/${orderId}/mock-pay`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '支付失败');
  }
  return res.json();
}

export async function fetchCrowdfundingProjects(animalId?: string) {
  const search = animalId ? `?animalId=${animalId}` : '';
  const res = await fetch(`${API_BASE}/api/v1/crowdfunding${search}`);
  if (!res.ok) throw new Error('加载众筹失败');
  return res.json();
}

export async function fetchCrowdfundingDetail(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/crowdfunding/${id}`);
  if (!res.ok) throw new Error('加载众筹详情失败');
  return res.json();
}

export async function fetchDonationTransparency(page = 1) {
  const res = await fetch(`${API_BASE}/api/v1/payments/transparency?page=${page}`);
  if (!res.ok) throw new Error('加载捐赠公示失败');
  return res.json();
}

export async function fetchMyCloudAdoptions() {
  const res = await fetch(`${API_BASE}/api/v1/cloud-adoptions/mine`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('加载云领养失败');
  return res.json();
}

export async function fetchCloudAdoptionRecommend() {
  const res = await fetch(`${API_BASE}/api/v1/cloud-adoptions/recommend`);
  if (!res.ok) throw new Error('加载推荐失败');
  return res.json();
}

export async function adoptCloudAnimal(animalId: string) {
  const res = await fetch(`${API_BASE}/api/v1/cloud-adoptions/animals/${animalId}`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '云领养失败');
  }
  return res.json();
}

export async function fetchCareUpdates(animalId: string) {
  const res = await fetch(`${API_BASE}/api/v1/animals/${animalId}/care-updates`);
  if (!res.ok) throw new Error('加载动态失败');
  return res.json();
}

export async function fetchBlessings(animalId: string) {
  const res = await fetch(`${API_BASE}/api/v1/animals/${animalId}/blessings`);
  if (!res.ok) throw new Error('加载祝福失败');
  return res.json();
}

export async function postBlessing(animalId: string, content: string) {
  const res = await fetch(`${API_BASE}/api/v1/animals/${animalId}/blessings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '发送失败');
  }
  return res.json();
}

export async function fetchActivityFeed() {
  const res = await fetch(`${API_BASE}/api/v1/feed/activity`);
  if (!res.ok) throw new Error('加载动态失败');
  return res.json();
}

export async function fetchLeaderboard(cityCode?: string, period: 'week' | 'month' = 'week') {
  const search = new URLSearchParams({ period });
  if (cityCode) search.set('cityCode', cityCode);
  const res = await fetch(`${API_BASE}/api/v1/leaderboard/donations?${search}`);
  if (!res.ok) throw new Error('加载排行榜失败');
  return res.json();
}

export async function fetchMapPois(params: {
  bbox: string;
  cityCode?: string;
  type?: string;
}) {
  const search = new URLSearchParams({ bbox: params.bbox });
  if (params.cityCode) search.set('cityCode', params.cityCode);
  if (params.type) search.set('type', params.type);
  const res = await fetch(`${API_BASE}/api/v1/pois/map?${search}`);
  if (!res.ok) throw new Error('加载 POI 失败');
  return res.json();
}

export async function fetchEvents(cityCode?: string) {
  const search = cityCode ? `?cityCode=${cityCode}` : '';
  const res = await fetch(`${API_BASE}/api/v1/events${search}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('加载活动失败');
  return res.json();
}

export async function fetchEventDetail(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/events/${id}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('加载活动详情失败');
  return res.json();
}

export async function registerEvent(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/events/${id}/register`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '报名失败');
  }
  return res.json();
}

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/api/v1/messaging/conversations`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('加载会话失败');
  return res.json();
}

export async function fetchConversationMessages(conversationId: string) {
  const res = await fetch(
    `${API_BASE}/api/v1/messaging/conversations/${conversationId}/messages`,
    { headers: await authHeaders() },
  );
  if (!res.ok) throw new Error('加载消息失败');
  return res.json();
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
) {
  const res = await fetch(
    `${API_BASE}/api/v1/messaging/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeaders()),
      },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '发送失败');
  }
  return res.json();
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PublishDraft } from '@pet/shared';
import { PUBLISH_DRAFT_KEY } from '@pet/shared';

export async function loadPublishDraft(): Promise<PublishDraft | null> {
  const raw = await AsyncStorage.getItem(PUBLISH_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublishDraft;
  } catch {
    return null;
  }
}

export async function savePublishDraft(draft: PublishDraft): Promise<void> {
  await AsyncStorage.setItem(
    PUBLISH_DRAFT_KEY,
    JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
  );
}

export async function clearPublishDraft(): Promise<void> {
  await AsyncStorage.removeItem(PUBLISH_DRAFT_KEY);
}

export function emptyDraft(): PublishDraft {
  return {
    step: 1,
    photos: [],
    tags: [],
    updatedAt: new Date().toISOString(),
  };
}

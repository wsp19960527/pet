import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_TOKEN_KEY } from '@pet/shared';

export interface AuthUser {
  id: string;
  phone: string;
  nickname: string | null;
  role: string;
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(USER_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await AsyncStorage.setItem(USER_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  await AsyncStorage.removeItem(USER_TOKEN_KEY);
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

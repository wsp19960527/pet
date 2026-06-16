import { Platform } from 'react-native';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${defaultHost}:3000`;

import type { MediaAssetInfo, MediaUploadCredential } from '@pet/shared';
import { MAX_PHOTO_BYTES } from '@pet/shared';
import * as ImageManipulator from 'expo-image-manipulator';
import { authHeaders } from './auth';
import { API_BASE } from './config';

export async function compressImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

async function getUploadCredential(filename: string, mimeType: string) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
  };
  const res = await fetch(`${API_BASE}/api/v1/media/sts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename, mimeType }),
  });
  if (!res.ok) {
    throw new Error('获取上传凭证失败');
  }
  const json = (await res.json()) as { data: MediaUploadCredential };
  return json.data;
}

export async function uploadPhoto(localUri: string): Promise<MediaAssetInfo> {
  const compressed = await compressImage(localUri);
  const filename = `photo-${Date.now()}.jpg`;

  const response = await fetch(compressed.uri);
  const blob = await response.blob();
  if (blob.size > MAX_PHOTO_BYTES) {
    throw new Error('单张图片不能超过 10MB');
  }

  const credential = await getUploadCredential(filename, compressed.mimeType);

  if (credential.mode === 'local') {
    const form = new FormData();
    form.append('file', {
      uri: compressed.uri,
      name: filename,
      type: compressed.mimeType,
    } as unknown as Blob);

    const uploadRes = await fetch(
      `${credential.uploadUrl}?objectKey=${encodeURIComponent(credential.objectKey)}`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: form,
      },
    );
    if (!uploadRes.ok) {
      throw new Error('图片上传失败');
    }
    const json = (await uploadRes.json()) as { data: MediaAssetInfo };
    return json.data;
  }

  throw new Error('OSS 直传尚未配置，请使用本地开发模式');
}

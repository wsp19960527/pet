import {
  AnimalSpecies,
  CoordinateSystem,
  MAX_REPORT_PHOTOS,
  type PublishDraft,
} from '@pet/shared';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/publish/StepIndicator';
import { createAnimal, fetchCities } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { uploadPhoto } from '@/lib/mediaUpload';
import {
  clearPublishDraft,
  emptyDraft,
  loadPublishDraft,
  savePublishDraft,
} from '@/lib/publishDraft';
import { tokens } from '@/theme/tokens';

const SPECIES_OPTIONS = [
  { value: AnimalSpecies.CAT, label: '猫' },
  { value: AnimalSpecies.DOG, label: '狗' },
  { value: AnimalSpecies.OTHER, label: '其他' },
] as const;

const TAG_OPTIONS = ['亲人', '怕人', '受伤', '幼崽', '群居'];

interface PublishWizardProps {
  onSuccess: () => void;
  onRequireLogin: () => void;
}

export function PublishWizard({ onSuccess, onRequireLogin }: PublishWizardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<PublishDraft>(emptyDraft());
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cityName, setCityName] = useState('北京');

  useEffect(() => {
    void loadPublishDraft().then((saved) => {
      if (saved) setDraft(saved);
    });
    void fetchCities().then((res) => {
      const beijing = res.data.find((c) => c.code === 'beijing');
      if (beijing) setCityName(beijing.name);
    });
  }, []);

  const persist = useCallback((next: PublishDraft) => {
    setDraft(next);
    void savePublishDraft(next);
  }, []);

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相册权限', '请在系统设置中允许访问相册');
      return;
    }

    const remaining = MAX_REPORT_PHOTOS - draft.photos.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        onRequireLogin();
        return;
      }

      const uploaded = [...draft.photos];
      for (const asset of result.assets) {
        if (uploaded.length >= MAX_REPORT_PHOTOS) break;
        const media = await uploadPhoto(asset.uri);
        uploaded.push({ uri: asset.uri, mediaId: media.id });
      }
      persist({ ...draft, photos: uploaded });
    } catch (err) {
      Alert.alert('上传失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setUploading(false);
    }
  }

  async function useCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要定位权限');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    persist({
      ...draft,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      cityCode: draft.cityCode ?? 'beijing',
      addressText: draft.addressText ?? '当前定位附近',
    });
  }

  async function submit() {
    const token = await getAccessToken();
    if (!token) {
      onRequireLogin();
      return;
    }

    const mediaIds = draft.photos
      .map((p) => p.mediaId)
      .filter((id): id is string => Boolean(id));

    if (!draft.species || !draft.latitude || !draft.longitude || mediaIds.length === 0) {
      Alert.alert('请完善信息');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAnimal({
        species: draft.species,
        description: draft.description,
        tags: Object.fromEntries((draft.tags ?? []).map((tag) => [tag, 'true'])),
        latitude: draft.latitude,
        longitude: draft.longitude,
        coordinateSystem: CoordinateSystem.GCJ02,
        addressText: draft.addressText,
        cityCode: draft.cityCode ?? 'beijing',
        mediaIds,
      });
      await clearPublishDraft();
      Alert.alert('上报成功', '内容已提交，审核通过后将显示在地图上', [
        {
          text: '查看详情',
          onPress: () => router.push(`/animal/${res.data.id}`),
        },
        { text: '返回地图', onPress: () => onSuccess() },
      ]);
    } catch (err) {
      Alert.alert('上报失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (draft.step === 1 && draft.photos.length === 0) {
      Alert.alert('请至少上传 1 张照片');
      return;
    }
    if (draft.step === 2 && !draft.species) {
      Alert.alert('请选择物种');
      return;
    }
    if (draft.step === 3 && (!draft.latitude || !draft.longitude)) {
      Alert.alert('请选择定位');
      return;
    }
    persist({ ...draft, step: Math.min(4, draft.step + 1) });
  }

  function prevStep() {
    persist({ ...draft, step: Math.max(1, draft.step - 1) });
  }

  function toggleTag(tag: string) {
    const tags = draft.tags ?? [];
    const next = tags.includes(tag)
      ? tags.filter((item) => item !== tag)
      : [...tags, tag];
    persist({ ...draft, tags: next });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepIndicator step={draft.step} />
      <Text style={styles.title}>上报小流浪</Text>

      {draft.step === 1 && (
        <View>
          <Text style={styles.hint}>最多 {MAX_REPORT_PHOTOS} 张，首张为主图</Text>
          <View style={styles.photoGrid}>
            {draft.photos.map((photo, index) => (
              <Image key={`${photo.uri}-${index}`} source={{ uri: photo.uri }} style={styles.photo} />
            ))}
            {draft.photos.length < MAX_REPORT_PHOTOS && (
              <Pressable style={[styles.photo, styles.addSlot]} onPress={() => void pickPhotos()}>
                {uploading ? (
                  <ActivityIndicator color={tokens.color.primary} />
                ) : (
                  <Text style={styles.addText}>+</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      )}

      {draft.step === 2 && (
        <View>
          <Text style={styles.label}>物种</Text>
          <View style={styles.chips}>
            {SPECIES_OPTIONS.map((item) => (
              <Pressable
                key={item.value}
                style={[styles.chip, draft.species === item.value && styles.chipActive]}
                onPress={() => persist({ ...draft, species: item.value })}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.species === item.value && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="毛色、健康状况、是否亲人…"
            value={draft.description ?? ''}
            onChangeText={(description) => persist({ ...draft, description })}
          />
          <Text style={styles.label}>标签</Text>
          <View style={styles.chips}>
            {TAG_OPTIONS.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.chip, draft.tags?.includes(tag) && styles.chipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.tags?.includes(tag) && styles.chipTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {draft.step === 3 && (
        <View>
          <Text style={styles.hint}>拖动地图选点，确认上报位置</Text>
          <Button title="使用当前定位" variant="secondary" onPress={() => void useCurrentLocation()} />
          <View style={styles.mapBox}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: draft.latitude ?? 39.9042,
                longitude: draft.longitude ?? 116.4074,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onPress={(event) => {
                persist({
                  ...draft,
                  latitude: event.nativeEvent.coordinate.latitude,
                  longitude: event.nativeEvent.coordinate.longitude,
                  cityCode: draft.cityCode ?? 'beijing',
                });
              }}
            >
              {draft.latitude && draft.longitude && (
                <Marker
                  coordinate={{
                    latitude: draft.latitude,
                    longitude: draft.longitude,
                  }}
                />
              )}
            </MapView>
          </View>
          <TextInput
            style={styles.input}
            placeholder="地址描述（可选）"
            value={draft.addressText ?? ''}
            onChangeText={(addressText) => persist({ ...draft, addressText })}
          />
        </View>
      )}

      {draft.step === 4 && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>确认发布</Text>
          <Text style={styles.previewLine}>城市：{cityName}</Text>
          <Text style={styles.previewLine}>
            物种：{SPECIES_OPTIONS.find((s) => s.value === draft.species)?.label ?? '-'}
          </Text>
          <Text style={styles.previewLine}>照片：{draft.photos.length} 张</Text>
          <Text style={styles.previewLine}>
            位置：{draft.addressText ?? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`}
          </Text>
          {draft.description ? (
            <Text style={styles.previewDesc}>{draft.description}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.actions}>
        {draft.step > 1 && (
          <Button title="上一步" variant="secondary" onPress={prevStep} style={styles.actionBtn} />
        )}
        {draft.step < 4 ? (
          <Button title="下一步" onPress={nextStep} style={styles.actionBtn} />
        ) : (
          <Button
            title={submitting ? '发布中…' : '发布'}
            onPress={() => void submit()}
            disabled={submitting}
            style={styles.actionBtn}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: tokens.color.foreground,
    marginBottom: tokens.spacing[3],
  },
  hint: {
    fontSize: 14,
    color: tokens.color.muted,
    marginBottom: tokens.spacing[3],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.foreground,
    marginBottom: tokens.spacing[2],
    marginTop: tokens.spacing[3],
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.border,
  },
  addSlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8C4BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 24,
    color: tokens.color.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  chip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.background,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chipActive: {
    backgroundColor: `${tokens.color.primary}18`,
    borderColor: tokens.color.primary,
  },
  chipText: {
    color: tokens.color.muted,
    fontSize: 14,
  },
  chipTextActive: {
    color: tokens.color.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    minHeight: 88,
    textAlignVertical: 'top',
    backgroundColor: tokens.color.surface,
    color: tokens.color.foreground,
  },
  mapBox: {
    height: 220,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    marginVertical: tokens.spacing[3],
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  preview: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: tokens.spacing[2],
    color: tokens.color.foreground,
  },
  previewLine: {
    fontSize: 14,
    color: tokens.color.muted,
    marginBottom: tokens.spacing[1],
  },
  previewDesc: {
    marginTop: tokens.spacing[2],
    fontSize: 14,
    color: tokens.color.foreground,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    marginTop: tokens.spacing[6],
  },
  actionBtn: {
    flex: 1,
  },
});

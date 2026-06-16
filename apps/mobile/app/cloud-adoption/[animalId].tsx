import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import {
  adoptCloudAnimal,
  fetchAnimalDetail,
  fetchBlessings,
  fetchCareUpdates,
  postBlessing,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { tokens } from '@/theme/tokens';

export default function CloudAdoptionDetailScreen() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchAnimalDetail>
  >['data'] | null>(null);
  const [careUpdates, setCareUpdates] = useState<
    Awaited<ReturnType<typeof fetchCareUpdates>>['data']
  >([]);
  const [blessings, setBlessings] = useState<
    Awaited<ReturnType<typeof fetchBlessings>>['data']
  >([]);
  const [blessingText, setBlessingText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!animalId) return;
    setLoading(true);
    try {
      const [detailRes, careRes, blessRes] = await Promise.all([
        fetchAnimalDetail(animalId),
        fetchCareUpdates(animalId),
        fetchBlessings(animalId),
      ]);
      setDetail(detailRes.data);
      setCareUpdates(careRes.data);
      setBlessings(blessRes.data);
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdopt() {
    if (!animalId) return;
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('请先登录');
      return;
    }
    try {
      await adoptCloudAnimal(animalId);
      Alert.alert('已成为云家长 ☁️');
      await load();
    } catch (err) {
      Alert.alert('失败', err instanceof Error ? err.message : '请重试');
    }
  }

  async function handleBlessing() {
    if (!animalId || !blessingText.trim()) return;
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('请先登录');
      return;
    }
    setSubmitting(true);
    try {
      await postBlessing(animalId, blessingText.trim());
      setBlessingText('');
      const blessRes = await fetchBlessings(animalId);
      setBlessings(blessRes.data);
    } catch (err) {
      Alert.alert('失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← 返回</Text>
        </Pressable>

        <Text style={styles.title}>
          {detail.cityName} · {detail.species}
        </Text>
        <Text style={styles.muted}>
          {detail.cloudParentCount} 位云家长
          {detail.cloudAdopted ? ' · 你已是云家长' : ''}
        </Text>

        {!detail.cloudAdopted && (
          <Button title="成为云家长" onPress={() => void handleAdopt()} style={{ marginTop: 12 }} />
        )}

        <Text style={styles.section}>每日动态</Text>
        {careUpdates.length === 0 ? (
          <Text style={styles.muted}>救助者尚未发布动态</Text>
        ) : (
          careUpdates.map((item) => (
            <View key={item.id} style={styles.updateCard}>
              <Text style={styles.updateAuthor}>{item.authorName ?? '救助者'}</Text>
              <Text style={styles.updateContent}>{item.content}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.section}>祝福墙</Text>
        <View style={styles.blessBox}>
          <TextInput
            style={styles.input}
            placeholder="写下你的祝福…"
            value={blessingText}
            onChangeText={setBlessingText}
          />
          <Button
            title={submitting ? '发送中' : '送祝福'}
            onPress={() => void handleBlessing()}
            disabled={submitting || !blessingText.trim()}
          />
        </View>
        {blessings.map((item) => (
          <View key={item.id} style={styles.blessCard}>
            <Text style={styles.blessAuthor}>{item.userNickname ?? '云家长'}</Text>
            <Text>{item.content}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: tokens.spacing[4] },
  back: { fontSize: 16, color: tokens.color.primary, marginBottom: tokens.spacing[3] },
  title: { fontSize: 22, fontWeight: '600', color: tokens.color.foreground },
  muted: { fontSize: 14, color: tokens.color.muted, marginTop: 4 },
  section: {
    marginTop: tokens.spacing[5],
    marginBottom: tokens.spacing[2],
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  updateCard: {
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing[2],
  },
  updateAuthor: { fontWeight: '600', fontSize: 13 },
  updateContent: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  time: { fontSize: 12, color: tokens.color.muted, marginTop: 6 },
  blessBox: { gap: tokens.spacing[2], marginBottom: tokens.spacing[3] },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
  },
  blessCard: {
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.accent,
  },
  blessAuthor: { fontWeight: '600', marginBottom: 4, fontSize: 13 },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchEventDetail, registerEvent } from '@/lib/api';
import { tokens } from '@/theme/tokens';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<
    Awaited<ReturnType<typeof fetchEventDetail>>['data'] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchEventDetail(id);
      setEvent(res.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister() {
    if (!id) return;
    setSubmitting(true);
    try {
      await registerEvent(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '报名失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>活动不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.org}>{event.organizationName}</Text>
      <Text style={styles.meta}>
        {new Date(event.startsAt).toLocaleString()}
        {event.addressText ? ` · ${event.addressText}` : ''}
      </Text>
      {event.description ? (
        <Text style={styles.desc}>{event.description}</Text>
      ) : null}
      <View style={styles.stats}>
        <Text style={styles.statText}>
          已报名 {event.registrationCount}/{event.capacity}
        </Text>
        <Text style={styles.statText}>剩余 {event.spotsLeft} 名额</Text>
      </View>
      <Pressable
        style={[styles.btn, event.registered && styles.btnDisabled]}
        disabled={event.registered || submitting || event.spotsLeft <= 0}
        onPress={() => void handleRegister()}
      >
        <Text style={styles.btnText}>
          {event.registered
            ? '已报名'
            : event.spotsLeft <= 0
              ? '名额已满'
              : submitting
                ? '提交中…'
                : '立即报名'}
        </Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>返回</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  content: { padding: tokens.spacing[4], gap: tokens.spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: tokens.color.foreground },
  org: { fontSize: 14, color: tokens.color.muted },
  meta: { fontSize: 13, color: tokens.color.muted },
  desc: { fontSize: 15, lineHeight: 22, color: tokens.color.foreground },
  stats: { flexDirection: 'row', gap: tokens.spacing[4] },
  statText: { fontSize: 14, color: tokens.color.foreground },
  btn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: tokens.color.onPrimary, fontWeight: '600' },
  back: { textAlign: 'center', color: tokens.color.muted, marginTop: 8 },
});

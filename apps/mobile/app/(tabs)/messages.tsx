import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchActivityFeed, fetchConversations } from '@/lib/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { tokens } from '@/theme/tokens';

type Tab = 'activity' | 'dm';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('activity');
  const [activityItems, setActivityItems] = useState<
    Awaited<ReturnType<typeof fetchActivityFeed>>['data']
  >([]);
  const [conversations, setConversations] = useState<
    Awaited<ReturnType<typeof fetchConversations>>['data']
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'activity') {
        const res = await fetchActivityFeed();
        setActivityItems(res.data);
      } else {
        const res = await fetchConversations();
        setConversations(res.data);
      }
    } catch {
      if (tab === 'activity') setActivityItems([]);
      else setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>消息</Text>
      <View style={styles.tabs}>
        {(['activity', 'dm'] as const).map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === 'activity' ? '救助动态' : '私信'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={tokens.color.primary} style={{ marginTop: 24 }} />
      ) : tab === 'activity' ? (
        <FlatList
          data={activityItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>暂无动态</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.cardLabel, { color: colors.muted }]}>
                {item.animalLabel}
              </Text>
              {item.content ? (
                <Text style={[styles.cardContent, { color: colors.text }]}>
                  {item.content}
                </Text>
              ) : null}
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              暂无私信，登录后可与救助者沟通
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/conversation/${item.id}`)}
            >
              <View style={styles.row}>
                <Text style={styles.cardTitle}>
                  {item.peerNickname ?? '用户'}
                </Text>
                {item.unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.cardLabel, { color: colors.muted }]} numberOfLines={1}>
                {item.lastMessage ?? '暂无消息'}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 20,
    fontWeight: '600',
    padding: tokens.spacing[4],
    paddingBottom: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  tabActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  tabText: { fontSize: 14, color: tokens.color.foreground },
  tabTextActive: { color: tokens.color.onPrimary, fontWeight: '600' },
  list: { padding: tokens.spacing[4], gap: tokens.spacing[3] },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: tokens.color.foreground },
  cardLabel: { fontSize: 13, marginTop: 4 },
  cardContent: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  time: { fontSize: 12, color: tokens.color.muted, marginTop: 8 },
  empty: { textAlign: 'center', marginTop: tokens.spacing[8] },
  badge: {
    backgroundColor: tokens.color.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

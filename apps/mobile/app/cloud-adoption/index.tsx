import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  fetchCloudAdoptionRecommend,
  fetchLeaderboard,
  fetchMyCloudAdoptions,
} from '@/lib/api';
import { tokens } from '@/theme/tokens';

export default function CloudAdoptionHubScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [mine, setMine] = useState<
    Awaited<ReturnType<typeof fetchMyCloudAdoptions>>['data']
  >([]);
  const [recommend, setRecommend] = useState<
    Awaited<ReturnType<typeof fetchCloudAdoptionRecommend>>['data']
  >([]);
  const [leaderboard, setLeaderboard] = useState<
    Awaited<ReturnType<typeof fetchLeaderboard>>['data']
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, recRes, lbRes] = await Promise.all([
        fetchMyCloudAdoptions().catch(() => ({ data: [] })),
        fetchCloudAdoptionRecommend(),
        fetchLeaderboard('beijing', 'week'),
      ]);
      setMine(mineRes.data);
      setRecommend(recRes.data);
      setLeaderboard(lbRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>我的云领养</Text>
      {mine.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>还没有云领养的毛孩子</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
          {mine.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/cloud-adoption/${item.animalId}`)}
            >
              <Card style={styles.mineCard}>
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumb}><Text>🐾</Text></View>
                )}
                <Text style={styles.mineLabel} numberOfLines={1}>
                  {item.cityName}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.title, { color: colors.text }]}>推荐云领养</Text>
      {recommend.map((item) => (
        <Pressable
          key={item.animalId}
          onPress={() => router.push(`/cloud-adoption/${item.animalId}`)}
        >
          <Card style={styles.recCard}>
            <Text style={[styles.recTitle, { color: colors.text }]}>
              {item.cityName} · {item.species}
            </Text>
            <Text style={{ color: colors.muted }}>
              {item.cloudParentCount} 位云家长 · {item.status}
            </Text>
          </Card>
        </Pressable>
      ))}

      <Text style={[styles.title, { color: colors.text }]}>爱心榜（本周·北京）</Text>
      {leaderboard.map((entry) => (
        <View key={entry.userId} style={styles.lbRow}>
          <Text style={styles.lbRank}>#{entry.rank}</Text>
          <Text style={[styles.lbName, { color: colors.text }]}>
            {entry.nickname ?? '匿名用户'}
          </Text>
          <Text style={styles.lbScore}>{entry.scoreLabel}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: tokens.spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginTop: tokens.spacing[4], marginBottom: tokens.spacing[2] },
  empty: { fontSize: 14, marginBottom: tokens.spacing[2] },
  row: { marginBottom: tokens.spacing[2] },
  mineCard: { width: 120, marginRight: tokens.spacing[3] },
  thumb: {
    height: 80,
    borderRadius: tokens.radius.md,
    backgroundColor: '#E8E4DC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mineLabel: { marginTop: 6, fontSize: 13, fontWeight: '500' },
  recCard: { marginBottom: tokens.spacing[3] },
  recTitle: { fontSize: 16, fontWeight: '600' },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  lbRank: { width: 36, fontWeight: '700', color: tokens.color.primary },
  lbName: { flex: 1, fontSize: 15 },
  lbScore: { fontWeight: '600', color: tokens.color.secondary },
});

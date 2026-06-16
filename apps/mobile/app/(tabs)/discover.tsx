import { AnimalSpecies, AnimalStatus, DiscoverSort } from '@pet/shared';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { statusLabel } from '@/components/map/AnimalMarker';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchDiscoverFeed, fetchEvents } from '@/lib/api';
import { tokens } from '@/theme/tokens';

const SPECIES_FILTERS: { label: string; value?: AnimalSpecies }[] = [
  { label: '全部' },
  { label: '猫', value: AnimalSpecies.CAT },
  { label: '狗', value: AnimalSpecies.DOG },
  { label: '其他', value: AnimalSpecies.OTHER },
];

const SORT_OPTIONS: { label: string; value: DiscoverSort }[] = [
  { label: '推荐', value: 'recommend' },
  { label: '附近', value: 'nearby' },
];

function formatDistance(m: number | null): string {
  if (m == null) return '';
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchDiscoverFeed>>['data']
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<DiscoverSort>('recommend');
  const [species, setSpecies] = useState<AnimalSpecies | undefined>();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [events, setEvents] = useState<
    Awaited<ReturnType<typeof fetchEvents>>['data']
  >([]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetchEvents('beijing');
      setEvents(res.data);
    } catch {
      setEvents([]);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      if (sort === 'nearby' && !coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
          return;
        }
      }

      const res = await fetchDiscoverFeed({
        sort,
        lat: sort === 'nearby' ? coords?.lat : undefined,
        lng: sort === 'nearby' ? coords?.lng : undefined,
        species,
        pageSize: 30,
      });
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sort, species, coords]);

  useEffect(() => {
    setLoading(true);
    void load();
    void loadEvents();
  }, [load, loadEvents]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSort(opt.value)}
              style={[
                styles.chip,
                sort === opt.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  sort === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.divider} />
          {SPECIES_FILTERS.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => setSpecies(opt.value)}
              style={[
                styles.chip,
                species === opt.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  species === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.color.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListHeaderComponent={
            events.length > 0 ? (
              <View style={styles.eventsSection}>
                <Text style={[styles.eventsTitle, { color: colors.text }]}>
                  近期活动
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {events.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => router.push(`/event/${event.id}`)}
                      style={styles.eventCard}
                    >
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventMeta, { color: colors.muted }]}>
                        {event.organizationName}
                      </Text>
                      <Text style={[styles.eventMeta, { color: colors.muted }]}>
                        {new Date(event.startsAt).toLocaleDateString()} · 剩
                        {event.spotsLeft} 名额
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              暂无内容
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/animal/${item.id}`)}
              style={{ flex: 1 }}
            >
              <Card style={styles.item}>
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumb}>
                    <Text style={{ fontSize: 32 }}>🐾</Text>
                  </View>
                )}
                <Text style={[styles.status, { color: colors.secondary }]}>
                  {statusLabel(item.status as AnimalStatus)}
                </Text>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.cityName ?? '未知'} · {item.species}
                </Text>
                <Text style={[styles.distance, { color: colors.muted }]}>
                  {formatDistance(item.distanceM) || `${item.likeCount} 赞`}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  chip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginRight: tokens.spacing[2],
  },
  chipActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  chipText: { fontSize: 13, color: tokens.color.foreground },
  chipTextActive: { color: '#fff' },
  divider: { width: 1, height: 24, backgroundColor: tokens.color.border, marginRight: tokens.spacing[2] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: tokens.spacing[4], gap: tokens.spacing[3] },
  row: { gap: tokens.spacing[3] },
  item: { flex: 1, minWidth: '45%' },
  thumb: {
    height: 100,
    borderRadius: tokens.radius.md,
    backgroundColor: '#E8E4DC',
    marginBottom: tokens.spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  status: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  distance: { fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: tokens.spacing[8] },
  eventsSection: { marginBottom: tokens.spacing[4], width: '100%' },
  eventsTitle: { fontSize: 16, fontWeight: '600', marginBottom: tokens.spacing[2] },
  eventCard: {
    width: 220,
    marginRight: tokens.spacing[3],
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  eventTitle: { fontSize: 14, fontWeight: '600', color: tokens.color.foreground },
  eventMeta: { fontSize: 12, marginTop: 4 },
});

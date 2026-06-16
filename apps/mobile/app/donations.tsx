import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDonationTransparency } from '@/lib/api';
import { tokens } from '@/theme/tokens';

export default function DonationsScreen() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchDonationTransparency>>['data']
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDonationTransparency();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>捐赠公示</Text>
      <Text style={styles.subtitle}>所有捐赠记录均已脱敏展示</Text>

      {loading ? (
        <ActivityIndicator color={tokens.color.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>暂无捐赠记录</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.donor}>{item.donorLabel}</Text>
                <Text style={styles.ref}>{item.refLabel}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.amount}>
                ¥{(item.amountCents / 100).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  title: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    color: tokens.color.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: tokens.color.muted,
    paddingHorizontal: tokens.spacing[4],
    marginTop: 4,
  },
  list: { padding: tokens.spacing[4], gap: tokens.spacing[3] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
    padding: tokens.spacing[4],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  donor: { fontSize: 15, fontWeight: '600', color: tokens.color.foreground },
  ref: { fontSize: 13, color: tokens.color.muted, marginTop: 2 },
  time: { fontSize: 12, color: tokens.color.muted, marginTop: 4 },
  amount: { fontSize: 18, fontWeight: '700', color: tokens.color.secondary },
  empty: { textAlign: 'center', color: tokens.color.muted, marginTop: 32 },
});

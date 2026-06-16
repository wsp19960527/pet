import { PaymentRefType } from '@pet/shared';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { TipSheet } from '@/components/payments/TipSheet';
import { Button } from '@/components/ui/Button';
import { fetchCrowdfundingDetail } from '@/lib/api';
import { tokens } from '@/theme/tokens';

export default function CrowdfundingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<
    Awaited<ReturnType<typeof fetchCrowdfundingDetail>>['data'] | null
  >(null);
  const [tipVisible, setTipVisible] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchCrowdfundingDetail(id);
      setProject(res.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !project) {
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

        <Text style={styles.title}>{project.title}</Text>
        {project.description ? (
          <Text style={styles.desc}>{project.description}</Text>
        ) : null}

        <View style={styles.progressBox}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${project.progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            已筹 ¥{(project.raisedAmountCents / 100).toFixed(0)} / 目标 ¥
            {(project.goalAmountCents / 100).toFixed(0)}（{project.progressPercent}%）
          </Text>
        </View>

        <Text style={styles.section}>资金用途</Text>
        {project.usageDetail.map((item) => (
          <View key={item.label} style={styles.usageRow}>
            <Text style={styles.usageLabel}>{item.label}</Text>
            <Text style={styles.usageAmount}>
              ¥{(item.amountCents / 100).toFixed(0)}
            </Text>
          </View>
        ))}

        {project.deadline ? (
          <Text style={styles.deadline}>
            截止：{new Date(project.deadline).toLocaleDateString()}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="支持众筹"
          onPress={() => setTipVisible(true)}
          style={{ flex: 1 }}
        />
      </View>

      <TipSheet
        visible={tipVisible}
        onClose={() => setTipVisible(false)}
        targetType={PaymentRefType.CROWDFUNDING}
        targetId={project.id}
        onSuccess={() => void load()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: tokens.spacing[4] },
  back: { fontSize: 16, color: tokens.color.primary, marginBottom: tokens.spacing[3] },
  title: { fontSize: 24, fontWeight: '600', color: tokens.color.foreground },
  desc: {
    marginTop: tokens.spacing[2],
    fontSize: 15,
    lineHeight: 22,
    color: tokens.color.muted,
  },
  progressBox: { marginTop: tokens.spacing[5] },
  progressTrack: {
    height: 8,
    backgroundColor: tokens.color.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.color.accent,
  },
  progressText: {
    marginTop: tokens.spacing[2],
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  section: {
    marginTop: tokens.spacing[5],
    marginBottom: tokens.spacing[2],
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  usageLabel: { fontSize: 14, color: tokens.color.foreground },
  usageAmount: { fontSize: 14, fontWeight: '600', color: tokens.color.secondary },
  deadline: {
    marginTop: tokens.spacing[4],
    fontSize: 13,
    color: tokens.color.muted,
  },
  footer: {
    padding: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
});

import type { MapAnimalMarker } from '@pet/shared';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { statusLabel } from '@/components/map/AnimalMarker';
import { tokens } from '@/theme/tokens';

interface AnimalPeekSheetProps {
  animal: MapAnimalMarker | null;
  onClose: () => void;
}

const SPECIES_LABEL = {
  cat: '猫',
  dog: '狗',
  other: '其他',
} as const;

export function AnimalPeekSheet({ animal, onClose }: AnimalPeekSheetProps) {
  const router = useRouter();

  if (!animal) {
    return (
      <Card style={styles.placeholder}>
        <Text style={styles.placeholderText}>点击地图 Marker 查看动物摘要</Text>
      </Card>
    );
  }

  function openDetail() {
    router.push(`/animal/${animal!.id}`);
  }

  return (
    <Pressable onPress={openDetail}>
      <Card style={styles.sheet}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {SPECIES_LABEL[animal.species]} · {statusLabel(animal.status)}
            </Text>
            <Text style={styles.subtitle}>
              {animal.addressText ?? '地址未知'} · {animal.viewCount} 次浏览
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>点击查看详情 →</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[2],
  },
  placeholder: {
    marginHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[2],
  },
  placeholderText: {
    color: tokens.color.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.color.muted,
    marginTop: tokens.spacing[1],
  },
  close: { fontSize: 18, color: tokens.color.muted, padding: 4 },
  hint: {
    fontSize: 12,
    color: tokens.color.primary,
    marginTop: tokens.spacing[2],
    fontWeight: '500',
  },
});

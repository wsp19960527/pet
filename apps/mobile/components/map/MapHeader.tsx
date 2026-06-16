import type { CityInfo } from '@pet/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/theme/tokens';

interface MapHeaderProps {
  city: CityInfo | null;
  cities: CityInfo[];
  loading?: boolean;
  animalCount?: number;
  poiCount?: number;
  showPois?: boolean;
  onTogglePois?: () => void;
  onCityChange: (city: CityInfo) => void;
}

export function MapHeader({
  city,
  cities,
  loading = false,
  animalCount = 0,
  poiCount = 0,
  showPois = true,
  onTogglePois,
  onCityChange,
}: MapHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable style={styles.cityButton}>
          <Text style={styles.cityLabel}>📍 {city?.name ?? '选择城市'}</Text>
        </Pressable>
        <Text style={styles.meta}>
          {loading ? '加载中…' : `${animalCount} 只 · ${poiCount} POI`}
        </Text>
      </View>
      <View style={styles.chips}>
        <Pressable
          onPress={onTogglePois}
          style={[styles.chip, showPois && styles.chipActive]}
        >
          <Text style={[styles.chipText, showPois && styles.chipTextActive]}>
            POI 图层
          </Text>
        </Pressable>
        {cities.slice(0, 5).map((item) => {
          const active = item.code === city?.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => onCityChange(item)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[3],
    marginHorizontal: tokens.spacing[4],
    marginTop: tokens.spacing[2],
    borderWidth: 1,
    borderColor: tokens.color.border,
    shadowColor: '#1A2E1A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[2],
  },
  cityButton: {
    flex: 1,
  },
  cityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  meta: {
    fontSize: 13,
    color: tokens.color.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  chip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: 6,
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
    fontSize: 13,
    color: tokens.color.muted,
  },
  chipTextActive: {
    color: tokens.color.primary,
    fontWeight: '600',
  },
});

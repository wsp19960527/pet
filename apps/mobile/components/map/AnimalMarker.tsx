import {
  ANIMAL_MARKER_COLORS,
  AnimalSpecies,
  AnimalStatus,
} from '@pet/shared';
import { StyleSheet, Text, View } from 'react-native';

const SPECIES_EMOJI: Record<AnimalSpecies, string> = {
  [AnimalSpecies.CAT]: '🐱',
  [AnimalSpecies.DOG]: '🐕',
  [AnimalSpecies.OTHER]: '🐾',
};

const STATUS_LABEL: Partial<Record<AnimalStatus, string>> = {
  [AnimalStatus.DISCOVERED]: '未救助',
  [AnimalStatus.CONTACTING]: '联系中',
  [AnimalStatus.RESCUED]: '已救助',
  [AnimalStatus.AT_VET]: '已送医',
  [AnimalStatus.FOSTERING]: '待领养',
  [AnimalStatus.ADOPTED]: '已领养',
};

type MarkerStatus = keyof typeof ANIMAL_MARKER_COLORS;

function markerColor(status: AnimalStatus): string {
  if (status in ANIMAL_MARKER_COLORS) {
    return ANIMAL_MARKER_COLORS[status as MarkerStatus];
  }
  return '#6C757D';
}

interface AnimalMarkerProps {
  species: AnimalSpecies;
  status: AnimalStatus;
  selected?: boolean;
}

export function AnimalMarkerView({
  species,
  status,
  selected = false,
}: AnimalMarkerProps) {
  const color = markerColor(status);

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.circle, { backgroundColor: color }]}>
        <Text style={styles.emoji}>{SPECIES_EMOJI[species]}</Text>
      </View>
      {status === AnimalStatus.DISCOVERED && <View style={styles.pulse} />}
    </View>
  );
}

export function statusLabel(status: AnimalStatus): string {
  return STATUS_LABEL[status] ?? status;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapSelected: {
    transform: [{ scale: 1.15 }],
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#1A2E1A',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emoji: {
    fontSize: 16,
  },
  pulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(224, 122, 95, 0.25)',
    zIndex: -1,
  },
});

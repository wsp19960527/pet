import {
  ANIMAL_STATUS_FLOW,
  ANIMAL_STATUS_LABELS,
  AnimalStatus,
} from '@pet/shared';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/theme/tokens';

interface StatusStepperProps {
  status: AnimalStatus;
}

function stepIndex(status: AnimalStatus): number {
  const idx = ANIMAL_STATUS_FLOW.indexOf(
    status as (typeof ANIMAL_STATUS_FLOW)[number],
  );
  if (idx >= 0) return idx;
  if (status === AnimalStatus.DECEASED || status === AnimalStatus.ABANDONED) {
    return ANIMAL_STATUS_FLOW.length - 1;
  }
  return 0;
}

export function StatusStepper({ status }: StatusStepperProps) {
  const current = stepIndex(status);
  const isTerminal =
    status === AnimalStatus.DECEASED || status === AnimalStatus.ABANDONED;

  return (
    <View style={styles.wrap}>
      {isTerminal && (
        <Text style={styles.terminal}>{ANIMAL_STATUS_LABELS[status]}</Text>
      )}
      <View style={styles.row}>
        {ANIMAL_STATUS_FLOW.map((step, index) => {
          const done = index < current;
          const active = index === current && !isTerminal;
          return (
            <View key={step} style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              />
              {index < ANIMAL_STATUS_FLOW.length - 1 && (
                <View
                  style={[
                    styles.line,
                    index < current && styles.lineDone,
                  ]}
                />
              )}
              <Text
                style={[
                  styles.label,
                  (done || active) && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {ANIMAL_STATUS_LABELS[step]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: tokens.spacing[3],
  },
  terminal: {
    color: tokens.color.destructive,
    fontSize: 13,
    marginBottom: tokens.spacing[2],
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    zIndex: 1,
  },
  dotDone: {
    backgroundColor: tokens.color.primaryLight,
    borderColor: tokens.color.primaryLight,
  },
  dotActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
    transform: [{ scale: 1.2 }],
  },
  line: {
    position: 'absolute',
    top: 5,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: tokens.color.border,
    zIndex: 0,
  },
  lineDone: {
    backgroundColor: tokens.color.primaryLight,
  },
  label: {
    marginTop: tokens.spacing[2],
    fontSize: 10,
    color: tokens.color.muted,
    textAlign: 'center',
  },
  labelActive: {
    color: tokens.color.primary,
    fontWeight: '600',
  },
});

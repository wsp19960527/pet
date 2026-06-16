import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/theme/tokens';

interface StepIndicatorProps {
  step: number;
  total?: number;
}

export function StepIndicator({ step, total = 4 }: StepIndicatorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        步骤 {step}/{total}
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, index) => {
          const n = index + 1;
          const active = n === step;
          const done = n < step;
          return (
            <View
              key={n}
              style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: tokens.spacing[4],
  },
  label: {
    fontSize: 13,
    color: tokens.color.muted,
    marginBottom: tokens.spacing[2],
  },
  dots: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.color.border,
  },
  dotDone: {
    backgroundColor: tokens.color.primaryLight,
  },
  dotActive: {
    backgroundColor: tokens.color.primary,
  },
});

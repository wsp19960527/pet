import { StyleSheet, View, type ViewProps } from 'react-native';
import { tokens } from '@/theme/tokens';

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.color.border,
    shadowColor: tokens.color.foreground,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

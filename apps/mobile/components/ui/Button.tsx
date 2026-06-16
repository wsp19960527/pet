import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { tokens } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  style?: PressableProps['style'];
}

export function Button({ title, variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={(state) => {
        const base = [
          styles.base,
          variantStyles[variant],
          state.pressed && styles.pressed,
        ];
        if (typeof style === 'function') {
          return [...base, style(state)];
        }
        return [...base, style];
      }}
      {...props}
    >
      <Text style={[styles.text, variant === 'primary' && styles.textPrimary]}>{title}</Text>
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: tokens.color.primary },
  secondary: {
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.secondary,
  },
  ghost: { backgroundColor: 'transparent' },
});

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[4],
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  textPrimary: { color: tokens.color.onPrimary },
});

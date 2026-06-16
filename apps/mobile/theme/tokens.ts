/** Design tokens from docs/ui-design.md */
export const tokens = {
  color: {
    primary: '#2D6A4F',
    primaryLight: '#40916C',
    onPrimary: '#FFFFFF',
    secondary: '#E07A5F',
    accent: '#F4A261',
    info: '#457B9D',
    background: '#FAF7F2',
    surface: '#FFFFFF',
    foreground: '#1A2E1A',
    muted: '#5C6B5C',
    border: '#E8E4DC',
    destructive: '#C1121F',
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
} as const;

export type Tokens = typeof tokens;

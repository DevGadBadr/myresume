export type ColorTheme = 'light' | 'dark';

export const DEFAULT_COLOR_THEME: ColorTheme = 'light';

export function normalizeColorTheme(value: unknown): ColorTheme {
  return value === 'dark' ? 'dark' : DEFAULT_COLOR_THEME;
}

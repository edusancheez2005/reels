import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import brand from '../../brand.json';

// Fonts: "google" downloads Inter + JetBrains Mono at render time (needs internet).
// "system" falls back to locally installed fonts (offline renders).
if (brand.fontSource === 'google') {
  loadInter('normal', {weights: ['500', '700', '800'], subsets: ['latin']});
  loadMono('normal', {weights: ['500', '700'], subsets: ['latin']});
}

export const theme = {
  accent: brand.accent,
  alert: brand.alert,
  bg: brand.bg,
  panel: brand.panel,
  line: brand.line,
  text: brand.text,
  muted: brand.muted,
  font: `Inter, "Helvetica Neue", Arial, sans-serif`,
  mono: `"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`,
  captionSize: brand.captionSize,
  captionY: brand.captionY,
  progressBar: brand.progressBar,
  handle: brand.handle,
};

export const tone = (t?: string) =>
  t === 'alert' ? theme.alert : t === 'muted' ? theme.muted : t === 'accent' ? theme.accent : theme.text;

/** Hex colour with alpha, e.g. alpha('#4F8CFF', 0.2) */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

import React, {createContext, useContext} from 'react';
import brand from '../../brand.json';

export type Palette = {
  name: 'dark' | 'light';
  bg: string;
  bg2: string;
  panel: string;
  panel2: string;
  line: string;
  text: string;
  dim: string;
  muted: string;
  accent: string;
  accent2: string;
  alert: string;
  good: string;
  grid: string;
  shadow: string;
};

const b = brand as Record<string, unknown>;

export const PALETTES: Record<'dark' | 'light', Palette> = {
  dark: {
    name: 'dark',
    bg: (b.bg as string) ?? '#09090B',
    bg2: '#121318',
    panel: (b.panel as string) ?? '#16171C',
    panel2: '#1E2028',
    line: (b.line as string) ?? '#2A2D37',
    text: (b.text as string) ?? '#F4F5F8',
    dim: '#5D6270',
    muted: (b.muted as string) ?? '#8A90A0',
    accent: (b.accent as string) ?? '#4F8CFF',
    accent2: '#9B6BFF',
    alert: (b.alert as string) ?? '#FF5C5C',
    good: '#3DDC84',
    grid: 'rgba(255,255,255,0.045)',
    shadow: '0 40px 90px rgba(0,0,0,0.55)',
  },
  light: {
    name: 'light',
    bg: '#ECECEE',
    bg2: '#F6F6F7',
    panel: '#FFFFFF',
    panel2: '#F3F3F5',
    line: '#D9D9DE',
    text: '#111114',
    dim: '#B2B2BA',
    muted: '#7D7D88',
    accent: (b.accent as string) ?? '#3D7BFF',
    accent2: '#7A4DFF',
    alert: '#E5484D',
    good: '#16A34A',
    grid: 'rgba(0,0,0,0.05)',
    shadow: '0 30px 70px rgba(20,20,40,0.16)',
  },
};

const Ctx = createContext<Palette>(PALETTES.dark);

export const PaletteProvider: React.FC<{name?: string; children: React.ReactNode}> = ({name, children}) => (
  <Ctx.Provider value={PALETTES[name === 'light' ? 'light' : 'dark']}>{children}</Ctx.Provider>
);

export const usePal = () => useContext(Ctx);

export const toneOf = (pal: Palette, t?: string) =>
  t === 'alert' ? pal.alert : t === 'good' ? pal.good : t === 'muted' ? pal.muted : t === 'accent' ? pal.accent : t === 'accent2' ? pal.accent2 : pal.text;

export const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

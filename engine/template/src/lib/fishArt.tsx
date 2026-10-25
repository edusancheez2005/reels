import React from 'react';
import {rnd} from './anim';

/**
 * Detailed cod parts for close-up scenes (original drawings). All in the cod's own coords:
 * 0..400 × 0..170, facing right, spine along y≈84, head behind x≈322.
 */
export const COD = {
  body: 'M34 86 C70 44 150 30 236 32 C306 34 356 54 388 84 C360 110 306 126 236 128 C152 130 74 120 34 86 Z',
  fillet: 'M38 86 C72 46 150 31 236 32 C272 33 300 38 322 46 C331 70 333 96 324 116 C300 122 270 127 236 128 C152 130 76 120 38 86 Z',
  head: 'M322 46 C342 52 366 64 388 84 C368 103 346 114 324 116 C333 96 331 70 322 46 Z',
  tail: 'M46 86 L4 44 C14 70 16 80 14 86 C16 92 14 102 4 128 Z',
  gillCut: [[322, 40], [326, 118]] as [number, number][],
  spine: [[324, 84], [46, 86]] as [number, number][],
};

/** A point inside the fish body (deterministic), for droplets / crystals. */
export const bodyPoint = (i: number): [number, number] => {
  const x = 70 + rnd(i * 3.1) * 260;
  const half = 40 * Math.sin(((x - 34) / 354) * Math.PI) + 6;
  const y = 84 + (rnd(i * 5.7) - 0.5) * 2 * half * 0.85;
  return [x, y];
};

export const Fins: React.FC<{color?: string}> = ({color = '#6E5F36'}) => (
  <g>
    <path d="M150 38 C158 14 178 8 192 34 Z" fill={color} />
    <path d="M204 33 C214 6 240 2 254 32 Z" fill={color} />
    <path d="M268 37 C278 12 302 10 314 42 Z" fill={color} />
    <path d="M206 126 C214 152 238 154 252 126 Z" fill="#8A7A4C" />
    <path d="M268 122 C278 146 300 148 312 118 Z" fill="#8A7A4C" />
    {[0, 1, 2, 3].map((k) => (
      <line key={k} x1={160 + k * 8} y1={36} x2={166 + k * 6} y2={18 + k * 2} stroke="#5A4D2A" strokeWidth={1.2} opacity={0.6} />
    ))}
  </g>
);

/** The skin side of the fillet (what you see on a whole fish), with optional frost progress. */
export const SkinSide: React.FC<{id: string; frost?: number; wet?: number}> = ({id, frost = 0, wet = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6F6036" />
        <stop offset="0.42" stopColor="#A89466" />
        <stop offset="0.66" stopColor="#E8DFC4" />
        <stop offset="1" stopColor="#F7F2E4" />
      </linearGradient>
      <clipPath id={`${id}-fclip`}>
        <path d={COD.fillet} />
      </clipPath>
    </defs>
    <path d={COD.fillet} fill={`url(#${id}-skin)`} />
    <g clipPath={`url(#${id}-fclip)`}>
      {/* scale texture */}
      {Array.from({length: 120}).map((_, i) => {
        const x = 40 + (i % 20) * 15 + ((Math.floor(i / 20) % 2) * 7);
        const y = 34 + Math.floor(i / 20) * 16;
        return <path key={i} d={`M ${x} ${y} q 7 6 0 12`} stroke="rgba(60,48,20,0.18)" strokeWidth={1.2} fill="none" />;
      })}
      {/* mottled spots */}
      {Array.from({length: 26}).map((_, i) => (
        <circle key={i} cx={50 + rnd(i * 2.3) * 270} cy={40 + rnd(i * 4.1) * 38} r={2.5 + rnd(i) * 3.5} fill="#4F4322" opacity={0.45} />
      ))}
      <path d="M48 82 C150 70 250 66 330 72" stroke="#F4EEDB" strokeWidth={3.2} fill="none" opacity={0.85} />
      {/* wet sheen */}
      <path d="M90 52 C160 40 240 38 300 46" stroke="#fff" strokeWidth={5} fill="none" opacity={0.35 * wet} strokeLinecap="round" />
    </g>
    {frost > 0 ? <Frost id={id} t={frost} clip={COD.fillet} /> : null}
  </g>
);

/** The flesh side of a fillet: white with W-shaped muscle bands. */
export const FleshSide: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <clipPath id={`${id}-flclip`}>
        <path d={COD.fillet} />
      </clipPath>
      <linearGradient id={`${id}-flesh`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBF6F1" />
        <stop offset="0.5" stopColor="#F6E9E0" />
        <stop offset="1" stopColor="#FCF8F4" />
      </linearGradient>
    </defs>
    <path d={COD.fillet} fill={`url(#${id}-flesh)`} stroke="#E9D6C8" strokeWidth={2} />
    <g clipPath={`url(#${id}-flclip)`}>
      {Array.from({length: 16}).map((_, i) => {
        const x = 60 + i * 17;
        return <path key={i} d={`M ${x + 10} 30 L ${x - 4} 62 L ${x + 8} 84 L ${x - 4} 106 L ${x + 10} 132`} stroke="#EAD5C6" strokeWidth={2.4} fill="none" />;
      })}
      <path d="M48 84 C150 82 250 82 322 84" stroke="#E7B9A8" strokeWidth={5} opacity={0.7} />
    </g>
  </g>
);

/** What's left after the fillet comes off: pink flesh with spine, ribs and pin bones. */
export const Frame: React.FC<{id: string}> = ({id}) => (
  <g>
    <path d={COD.fillet} fill="#F1D9CC" />
    <defs>
      <clipPath id={`${id}-frclip`}>
        <path d={COD.fillet} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-frclip)`}>
      {Array.from({length: 12}).map((_, i) => {
        const x = 70 + i * 21;
        return <path key={i} d={`M ${x + 8} 30 L ${x - 4} 62 L ${x + 6} 84 L ${x - 4} 106 L ${x + 8} 132`} stroke="#E6C1B0" strokeWidth={2} fill="none" />;
      })}
      {/* ribs over the belly cavity */}
      {Array.from({length: 9}).map((_, i) => {
        const x = 214 + i * 12;
        return <path key={i} d={`M ${x} 86 C ${x - 8} 100, ${x - 10} 112, ${x - 16} 124`} stroke="#FFF8F2" strokeWidth={3.2} fill="none" strokeLinecap="round" />;
      })}
      {/* pin bones / pterygiophores along the back */}
      {Array.from({length: 18}).map((_, i) => {
        const x = 70 + i * 14;
        return <line key={i} x1={x} y1={82} x2={x + 6} y2={48} stroke="#FFF8F2" strokeWidth={2.2} strokeLinecap="round" opacity={0.95} />;
      })}
      <path d="M46 86 C150 84 250 84 324 84" stroke="#B85C4A" strokeWidth={9} opacity={0.35} />
      <path d="M46 86 C150 84 250 84 324 84" stroke="#FFF6EE" strokeWidth={6} />
      {Array.from({length: 23}).map((_, i) => (
        <line key={i} x1={54 + i * 12} y1={80} x2={54 + i * 12} y2={89} stroke="#DCC2B4" strokeWidth={1.6} />
      ))}
    </g>
  </g>
);

export const Head: React.FC = () => (
  <g>
    <path d={COD.head} fill="#9E8A5A" />
    <path d="M330 92 C350 100 370 98 388 86 C370 104 348 114 326 116 Z" fill="#EDE4CB" />
    <path d="M322 46 C331 70 333 96 324 116" stroke="#5C4E2A" strokeWidth={2.5} fill="none" opacity={0.6} />
    <circle cx={350} cy={70} r={8} fill="#fff" />
    <circle cx={352} cy={70} r={4.6} fill="#151515" />
    <circle cx={350} cy={68} r={1.6} fill="#fff" />
    <path d="M372 92 C378 94 384 92 388 88" stroke="#5C4E2A" strokeWidth={2.4} fill="none" />
    <path d="M362 112 C364 120 366 126 362 132" stroke="#5C4E2A" strokeWidth={2.4} fill="none" />
    <path d="M300 96 C314 104 318 114 306 120 C298 112 296 104 300 96 Z" fill="#9C8B5A" />
  </g>
);

export const Tail: React.FC = () => <path d={COD.tail} fill="#7F6F43" />;

/** Whole detailed cod (tail + fins + skin + head). */
export const CodDetailed: React.FC<{id: string; frost?: number; wet?: number}> = ({id, frost = 0, wet = 0}) => (
  <g>
    <Tail />
    <Fins />
    <SkinSide id={id} frost={frost} wet={wet} />
    <Head />
    {frost > 0 ? <Frost id={`${id}h`} t={frost} clip={COD.head} /> : null}
  </g>
);

/** Frost that grows: tint, rim and crystals appear progressively with t (0..1). */
export const Frost: React.FC<{id: string; t: number; clip: string}> = ({id, t, clip}) => {
  const N = 34;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-frost`}>
          <path d={clip} />
        </clipPath>
        <filter id={`${id}-fblur`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d={clip} fill={`rgba(186,222,255,${0.55 * t})`} />
      <path d={clip} fill="none" stroke="#fff" strokeWidth={6 * t} opacity={0.85 * t} filter={`url(#${id}-fblur)`} />
      <g clipPath={`url(#${id}-frost)`}>
        {Array.from({length: N}).map((_, i) => {
          const born = (i / N) * 0.75;
          const g = Math.max(0, Math.min(1, (t - born) / 0.25));
          if (g <= 0) return null;
          const [x, y] = bodyPoint(i + 11);
          const r = (4 + (i % 4) * 2.6) * g;
          return (
            <g key={i} stroke="#fff" strokeWidth={1.6} opacity={0.95} strokeLinecap="round">
              {[0, 60, 120].map((a) => {
                const rad = (a * Math.PI) / 180;
                return <line key={a} x1={x - Math.cos(rad) * r} y1={y - Math.sin(rad) * r} x2={x + Math.cos(rad) * r} y2={y + Math.sin(rad) * r} />;
              })}
              {[0, 60, 120, 180, 240, 300].map((a) => {
                const rad = (a * Math.PI) / 180;
                const bx = x + Math.cos(rad) * r * 0.6;
                const by = y + Math.sin(rad) * r * 0.6;
                return <line key={`b${a}`} x1={bx} y1={by} x2={bx + Math.cos(rad + 0.6) * r * 0.35} y2={by + Math.sin(rad + 0.6) * r * 0.35} strokeWidth={1.1} />;
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** Blue nitrile glove. pose "press" = flat hand pointing right; "grip" = fist. Origin = palm centre. */
export const Glove: React.FC<{pose: 'press' | 'grip'; color?: string}> = ({pose, color = '#4F7DF3'}) => {
  const dark = '#3557C7';
  if (pose === 'grip') {
    return (
      <g>
        <rect x={-34} y={-30} width={68} height={58} rx={22} fill={color} />
        {[-18, -4, 10].map((x) => (
          <path key={x} d={`M ${x} -30 C ${x + 4} -36, ${x + 10} -36, ${x + 12} -30`} stroke={dark} strokeWidth={2.5} fill="none" />
        ))}
        <path d="M -30 -8 C -44 -18 -40 -34 -24 -32" fill={color} stroke={dark} strokeWidth={2} />
        <rect x={-30} y={20} width={60} height={34} rx={12} fill={color} />
        <rect x={-30} y={44} width={60} height={12} rx={6} fill={dark} />
      </g>
    );
  }
  return (
    <g>
      <rect x={-46} y={-30} width={78} height={64} rx={26} fill={color} />
      {[-22, -7, 8, 22].map((y, k) => (
        <rect key={y} x={20} y={y - 7} width={52 - Math.abs(k - 1.5) * 6} height={15} rx={7.5} fill={color} stroke={dark} strokeWidth={1.5} />
      ))}
      <rect x={-30} y={-48} width={40} height={16} rx={8} fill={color} stroke={dark} strokeWidth={1.5} transform="rotate(-25 -10 -40)" />
      <rect x={-96} y={-22} width={56} height={46} rx={14} fill={color} />
      <rect x={-104} y={-24} width={16} height={50} rx={6} fill={dark} />
    </g>
  );
};

/** Fillet knife with the tip at the origin and the blade extending along +x. */
export const FilletKnife: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="blade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    <path d="M0 0 C40 -4 120 -10 196 -11 L196 6 C130 6 50 4 0 0 Z" fill="url(#blade)" stroke="#64748B" strokeWidth={1.4} />
    <line x1={20} y1={-2} x2={180} y2={-8} stroke="#fff" strokeWidth={1.6} opacity={0.9} />
    <rect x={194} y={-14} width={10} height={24} rx={3} fill="#94A3B8" />
    <rect x={202} y={-12} width={104} height={20} rx={9} fill="#1F2937" />
    {[232, 262, 288].map((x) => (
      <circle key={x} cx={x} cy={-2} r={2.6} fill="#9CA3AF" />
    ))}
  </g>
);

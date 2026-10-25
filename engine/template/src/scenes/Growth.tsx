import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/** Bars that grow on their beats, with a multiplier badge arcing between first and last on the next beat. */
type Item = {label: string; value: number; display?: string};
type P = {items: Item[]; badge?: string; unit?: string};

export const Growth: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const n = props.items.length;
  const max = Math.max(...props.items.map((i) => i.value));
  const BW = Math.min(260, 700 / n);
  const gap = (900 - BW * n) / (n + 1);
  const BASE = 780;
  const HMAX = 560;
  const bp = revealFrame(beats, n) - LEAD_FRAMES;
  const badge = interpolate(frame, [bp, bp + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
  const xs = props.items.map((_, i) => 50 + gap + i * (BW + gap));
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <line x1={40} x2={960} y1={BASE} y2={BASE} stroke={pal.line} strokeWidth={3} />
        {props.items.map((it, i) => {
          const st = revealFrame(beats, i) - LEAD_FRAMES;
          const p = interpolate(frame, [st, st + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
          const h = Math.max(6, (it.value / max) * HMAX) * p;
          const last = i === n - 1;
          return (
            <g key={i} opacity={p > 0 ? 1 : 0}>
              <rect x={xs[i]} y={BASE - h} width={BW} height={h} rx={18} fill={last ? pal.accent : rgba(pal.accent, 0.35)} />
              <text x={xs[i] + BW / 2} y={BASE - h - 26} textAnchor="middle" fontFamily={theme.font} fontSize={58} fontWeight={800} fill={pal.text} opacity={p}>
                {it.display ?? it.value.toLocaleString('en-US')}
              </text>
              <text x={xs[i] + BW / 2} y={BASE + 56} textAnchor="middle" fontFamily={theme.font} fontSize={36} fontWeight={700} fill={pal.muted}>
                {it.label}
              </text>
            </g>
          );
        })}
        {props.badge && badge > 0 && n >= 2 ? (
          <g opacity={badge}>
            <path
              d={`M ${xs[0] + BW / 2} ${BASE - (props.items[0].value / max) * HMAX - 110} Q ${(xs[0] + xs[n - 1] + BW) / 2} ${BASE - HMAX - 170} ${xs[n - 1] + BW / 2 - 30} ${BASE - HMAX - 110}`}
              fill="none"
              stroke={pal.text}
              strokeWidth={4}
              strokeDasharray="10 10"
            />
            <g transform={`translate(${(xs[0] + xs[n - 1] + BW) / 2} ${BASE - HMAX - 150}) scale(${badge})`}>
              <rect x={-110} y={-48} width={220} height={96} rx={48} fill={pal.text} />
              <text x={0} y={18} textAnchor="middle" fontFamily={theme.font} fontSize={54} fontWeight={800} fill={pal.bg}>
                {props.badge}
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </Stage>
  );
};

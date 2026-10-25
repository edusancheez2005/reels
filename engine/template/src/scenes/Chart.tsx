import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, useReveal, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {theme, alpha} from '../lib/theme';

type P = {kind: 'bar' | 'line'; data: {label: string; value: number}[]; unit?: string; highlight?: number};

const fmt = (v: number, unit?: string) => `${v.toLocaleString('en-US', {maximumFractionDigits: 1})}${unit ?? ''}`;

const Bar: React.FC<{i: number; d: {label: string; value: number}; max: number; w: number; x: number; beats: number[]; hl: boolean; unit?: string}> = ({i, d, max, w, x, beats, hl, unit}) => {
  const {p} = useReveal(beats, i, 12);
  const H = 640;
  const h = (d.value / max) * H * p;
  const c = hl ? theme.accent : alpha(theme.accent, 0.45);
  return (
    <g>
      <rect x={x} y={760 - h} width={w} height={h} rx={14} fill={c} />
      <text x={x + w / 2} y={760 - h - 22} textAnchor="middle" fontSize={40} fontWeight={800} fill={theme.text} opacity={p} fontFamily={theme.font}>
        {fmt(d.value, unit)}
      </text>
      <text x={x + w / 2} y={820} textAnchor="middle" fontSize={32} fontWeight={600} fill={hl ? theme.text : theme.muted} opacity={p > 0 ? 1 : 0} fontFamily={theme.font}>
        {d.label}
      </text>
    </g>
  );
};

export const Chart: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const n = props.data.length;
  const max = Math.max(...props.data.map((d) => d.value)) || 1;
  const gap = 30;
  const w = (900 - gap * (n - 1)) / n;
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <line x1={50} y1={760} x2={950} y2={760} stroke={theme.line} strokeWidth={3} />
        {props.kind === 'bar'
          ? props.data.map((d, i) => <Bar key={i} i={i} d={d} max={max} w={w} x={50 + i * (w + gap)} beats={beats} hl={props.highlight === i} unit={props.unit} />)
          : (() => {
              // line charts zoom to the data range so small moves are visible
              const vals = props.data.map((d) => d.value);
              const vmin = Math.min(...vals);
              const span = max - vmin || Math.abs(max) * 0.1 || 1;
              const lo = vmin - span * 0.6;
              const hi = max + span * 0.25;
              const pts = props.data.map((d, i) => ({x: 70 + (n === 1 ? 430 : (i / (n - 1)) * 860), y: 760 - ((d.value - lo) / (hi - lo)) * 640}));
              const shown = pts.map((_, i) => interpolate(frame, [revealFrame(beats, i) - LEAD_FRAMES - 8, revealFrame(beats, i) - LEAD_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
              let path = '';
              pts.forEach((pt, i) => {
                if (i === 0) {
                  path = `M ${pt.x} ${pt.y}`;
                  return;
                }
                const t = shown[i];
                if (t <= 0) return;
                const prev = pts[i - 1];
                path += ` L ${prev.x + (pt.x - prev.x) * t} ${prev.y + (pt.y - prev.y) * t}`;
              });
              return (
                <g>
                  <path d={path} fill="none" stroke={theme.accent} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" opacity={shown[0] > 0 ? 1 : 0} />
                  {pts.map((pt, i) =>
                    shown[i] >= 1 ? (
                      <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r={props.highlight === i ? 18 : 11} fill={props.highlight === i ? theme.accent : theme.text} />
                        <text x={pt.x} y={pt.y - 32} textAnchor="middle" fontSize={34} fontWeight={800} fill={theme.text} fontFamily={theme.font}>
                          {fmt(props.data[i].value, props.unit)}
                        </text>
                        <text x={pt.x} y={820} textAnchor="middle" fontSize={30} fontWeight={600} fill={theme.muted} fontFamily={theme.font}>
                          {props.data[i].label}
                        </text>
                      </g>
                    ) : null,
                  )}
                </g>
              );
            })()}
      </svg>
    </Stage>
  );
};

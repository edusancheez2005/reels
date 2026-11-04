import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, rgba, toneOf} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * PriceTrack (4 Nov 2026, midterm dip-and-bounce reel): a REAL price series (e.g. CoinGecko hourly) drawn as a line.
 * On beat i the line extends to point `draw[i]` (index into `values`). `marks` pin a labelled dot to a point on their beat.
 * `split`: points up to this index use `toneA` (default alert = falling part), after it `toneB` (default good).
 * Props: values[], xLabels {i: text}[], title, logo, source, prefix, draw[], marks[{i, label, sub, tone, beat, side}], split.
 */
type Mark = {i: number; label: string; sub?: string; tone?: string; beat: number; side?: 'above' | 'below' | 'left' | 'right' | 'below-right'};
type P = {
  values: number[];
  title?: string;
  logo?: string;
  source?: string;
  prefix?: string;
  draw?: number[];
  marks?: Mark[];
  split?: number;
  toneA?: string;
  toneB?: string;
  xLabels?: {i: number; text: string}[];
};

const X0 = 70, X1 = 930, Y0 = 230, Y1 = 640;

export const PriceTrack: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const v = props.values;
  const n = v.length;
  const lo = Math.min(...v), hi = Math.max(...v);
  const pad = (hi - lo) * 0.12;
  const x = (i: number) => X0 + (i / (n - 1)) * (X1 - X0);
  const y = (val: number) => Y1 - ((val - (lo - pad)) / (hi + pad - (lo - pad))) * (Y1 - Y0);
  const draw = props.draw ?? [n - 1];
  // how far the line has drawn (fractional index)
  let upto = 0;
  draw.forEach((d, bi) => {
    const f = revealFrame(beats, Math.min(bi, beats.length - 1)) - LEAD_FRAMES;
    const prev = bi === 0 ? 0 : draw[bi - 1];
    const t = interpolate(frame, [f, f + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    if (t > 0) upto = prev + (d - prev) * t;
  });
  const split = props.split ?? -1;
  const toneA = toneOf(pal, props.toneA ?? 'alert');
  const toneB = toneOf(pal, props.toneB ?? 'good');
  const pts: {x: number; y: number; i: number}[] = [];
  for (let i = 0; i <= Math.floor(upto); i++) pts.push({x: x(i), y: y(v[i]), i});
  const fr = upto - Math.floor(upto);
  if (fr > 0 && Math.floor(upto) + 1 < n) {
    const a = Math.floor(upto);
    pts.push({x: x(a + fr), y: y(v[a] + (v[a + 1] - v[a]) * fr), i: a + fr});
  }
  const seg = (arr: typeof pts) => arr.map((p, k) => `${k ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const partA = split >= 0 ? pts.filter((p) => p.i <= split) : pts;
  const partB = split >= 0 ? pts.filter((p) => p.i >= split) : [];
  const tip = pts[pts.length - 1];
  const tipTone = split >= 0 && tip && tip.i > split ? toneB : split >= 0 ? toneA : pal.accent;
  const titleIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* grid */}
        {[0, 1, 2, 3].map((k) => {
          const gy = Y0 + (k / 3) * (Y1 - Y0);
          return <line key={k} x1={X0} x2={X1} y1={gy} y2={gy} stroke={rgba(pal.text, 0.08)} strokeWidth={2} />;
        })}
        {/* axis values */}
        <text x={X1} y={y(hi) - 14} textAnchor="end" fontFamily={theme.font} fontSize={28} fill={pal.muted} opacity={titleIn}>
          high {props.prefix ?? '$'}{Math.round(hi).toLocaleString('en-US')}
        </text>
        <text x={X1} y={y(lo) + 40} textAnchor="end" fontFamily={theme.font} fontSize={28} fill={pal.muted} opacity={titleIn}>
          low {props.prefix ?? '$'}{Math.round(lo).toLocaleString('en-US')}
        </text>
        {(props.xLabels ?? []).map((l, k) => (
          <text key={k} x={x(l.i)} y={Y1 + 190} textAnchor={l.i === 0 ? 'start' : l.i >= n - 1 ? 'end' : 'middle'} fontFamily={theme.font} fontSize={28} fontWeight={600} fill={pal.muted} opacity={titleIn}>
            {l.text}
          </text>
        ))}
        {/* area + line */}
        {pts.length > 1 ? (
          <path d={`${seg(pts)} L ${tip.x} ${Y1} L ${X0} ${Y1} Z`} fill={rgba(tipTone, 0.1)} />
        ) : null}
        {partA.length > 1 ? <path d={seg(partA)} fill="none" stroke={split >= 0 ? toneA : pal.accent} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {partB.length > 1 ? <path d={seg(partB)} fill="none" stroke={toneB} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {tip ? <circle cx={tip.x} cy={tip.y} r={14} fill={tipTone} /> : null}
        {/* marks */}
        {(props.marks ?? []).map((m, k) => {
          const f = revealFrame(beats, Math.min(m.beat, beats.length - 1)) - LEAD_FRAMES;
          const s = interpolate(frame, [f, f + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
          if (s <= 0) return null;
          const c = toneOf(pal, m.tone ?? 'text');
          const px = x(m.i), py = y(v[m.i]);
          const side = m.side ?? 'above';
          const above = side === 'above';
          let ly = above ? py - 150 : py + 120;
          let lx = Math.min(Math.max(px, 230), 770);
          if (side === 'left') { lx = Math.max(230, px - 250); ly = py + 30; }
          if (side === 'right') { lx = Math.min(770, px + 250); ly = py + 30; }
          if (side === 'below-right') { lx = Math.min(770, px + 230); ly = py + 110; }
          const sideways = side === 'left' || side === 'right';
          const lineEnd = sideways ? {x: lx + (side === 'left' ? 200 : -200), y: py} : {x: lx, y: ly + (above ? 30 : -58)};
          return (
            <g key={k} opacity={Math.min(1, s)}>
              <circle cx={px} cy={py} r={20 * s} fill="none" stroke={c} strokeWidth={6} />
              <line x1={px + (sideways ? (side === 'left' ? -22 : 22) : 0)} y1={py + (sideways ? 0 : above ? -22 : 22)} x2={lineEnd.x} y2={lineEnd.y} stroke={c} strokeWidth={4} />
              <rect x={lx - 200} y={ly - 58} width={400} height={m.sub ? 118 : 80} rx={18} fill={pal.panel} stroke={c} strokeWidth={4} />
              <text x={lx} y={ly - 6} textAnchor="middle" fontFamily={theme.font} fontSize={46} fontWeight={800} fill={c}>
                {m.label}
              </text>
              {m.sub ? (
                <text x={lx} y={ly + 40} textAnchor="middle" fontFamily={theme.font} fontSize={28} fontWeight={600} fill={pal.muted}>
                  {m.sub}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {/* title row */}
      <div style={{position: 'absolute', left: 70, top: 120, display: 'flex', alignItems: 'center', gap: 20, opacity: titleIn}}>
        {props.logo ? <Img src={props.logo.startsWith('http') ? props.logo : staticFile(props.logo)} style={{width: 64, height: 64}} /> : null}
        <div style={{fontFamily: theme.font, fontSize: 52, fontWeight: 800, color: pal.text}}>{props.title}</div>
      </div>
      {props.source ? (
        <div style={{position: 'absolute', left: 70, top: 870, fontFamily: theme.font, fontSize: 26, color: pal.muted, opacity: titleIn}}>
          {props.source}
        </div>
      ) : null}
    </Stage>
  );
};

import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, rnd, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * Thousands of dots drift, then assemble into a shape on beat 0, a label lands on beat 1,
 * and (optionally) the swarm splits into streams toward targets on the split beat.
 * Shapes are SVG path data; built-ins live in SHAPES. Draw your own in any viewBox.
 */
export const SHAPES: Record<string, {d: string; vb: [number, number]}> = {
  // generic side-view whale (original drawing)
  whale: {
    vb: [1000, 520],
    d: 'M965 262 C958 178 872 128 730 118 C580 108 432 136 318 186 C242 218 176 232 118 222 C96 196 78 168 52 140 C66 196 78 228 92 252 C72 276 58 314 42 360 C78 330 104 304 120 286 C180 280 240 296 310 322 C440 368 590 394 730 384 C850 376 958 342 965 262 Z M598 372 C566 432 524 474 470 498 C548 488 618 446 660 378 Z M402 160 L436 116 L462 150 Z',
  },
  fish: {
    vb: [1000, 500],
    d: 'M930 250 C880 140 720 90 560 100 C420 108 300 160 220 230 L80 120 L120 250 L80 380 L220 270 C300 340 420 392 560 400 C720 410 880 360 930 250 Z',
  },
  // generic cylindrical battery cell, side view
  battery: {vb: [1000, 500], d: 'M120 110 L820 110 Q860 110 860 150 L860 190 L920 190 Q940 190 940 210 L940 290 Q940 310 920 310 L860 310 L860 350 Q860 390 820 390 L120 390 Q80 390 80 350 L80 150 Q80 110 120 110 Z'},
  circle: {vb: [1000, 1000], d: 'M500 80 A420 420 0 1 1 499.9 80 Z'},
};

type Target = {x: number; y: number; label?: string};
type P = {
  shape: string;
  count?: number;
  label?: string;
  sublabel?: string;
  split?: Target[];
  tone?: 'accent' | 'good' | 'alert';
  formed?: boolean;
};

const sample = (d: string, vb: [number, number], n: number): [number, number][] => {
  if (typeof document === 'undefined') return [];
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(vb[0]));
  svg.setAttribute('height', String(vb[1]));
  svg.setAttribute('style', 'position:absolute;left:-99999px;top:0');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  svg.appendChild(p);
  document.body.appendChild(svg);
  const out: [number, number][] = [];
  const L = p.getTotalLength();
  const nEdge = Math.round(n * 0.3);
  for (let i = 0; i < nEdge; i++) {
    const q = p.getPointAtLength((L * i) / nEdge);
    out.push([q.x, q.y]);
  }
  const bb = p.getBBox();
  let s = 1;
  while (out.length < n && s < n * 60) {
    const x = bb.x + rnd(s * 2.1) * bb.width;
    const y = bb.y + rnd(s * 3.7 + 0.5) * bb.height;
    s++;
    if (p.isPointInFill(new DOMPoint(x, y))) out.push([x, y]);
  }
  svg.remove();
  return out;
};

export const ParticleShape: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const color = props.tone === 'good' ? pal.good : props.tone === 'alert' ? pal.alert : pal.accent;
  const shape = SHAPES[props.shape] ?? {d: props.shape, vb: [1000, 1000] as [number, number]};
  const n = props.count ?? 1100;
  const pts = useMemo(() => sample(shape.d, shape.vb, n), [shape.d, n]);

  // fit the shape into the stage (900 × 600 box centred at 500,430)
  const sc = Math.min(900 / shape.vb[0], 600 / shape.vb[1]);
  const ox = 500 - (shape.vb[0] * sc) / 2;
  const oy = 430 - (shape.vb[1] * sc) / 2;

  const t0 = props.formed ? -60 : revealFrame(beats, 0) - LEAD_FRAMES - 10; // converge finishes around beat 0
  const splitBeat = props.split ? revealFrame(beats, Math.max(1, beats.length - 1)) - LEAD_FRAMES : Infinity;
  const bob = Math.sin(frame / 18) * 7;

  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <filter id="pglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#pglow)">
          {pts.map(([px, py], i) => {
            const sx = rnd(i * 3.3) * 1200 - 100;
            const sy = rnd(i * 5.1 + 1) * 1000 - 50;
            const delay = rnd(i * 7.7) * 12;
            const p = interpolate(frame, [t0 + delay, t0 + delay + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
            const wob = 1 - p * 0.85;
            const wx = Math.sin(frame / 14 + i) * 10 * wob + Math.sin(frame / 31 + i * 0.7) * 2;
            const wy = Math.cos(frame / 17 + i * 1.3) * 10 * wob + Math.cos(frame / 27 + i) * 2;
            let x = sx + (ox + px * sc - sx) * p + wx;
            let y = sy + (oy + py * sc + bob - sy) * p + wy;
            if (props.split && frame >= splitBeat - 12) {
              const tg = props.split[i % props.split.length];
              const q = interpolate(frame, [splitBeat - 12 + rnd(i) * 8, splitBeat + 6 + rnd(i) * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
              const r = 6 + Math.sqrt(rnd(i * 9.1)) * 58;
              const a = rnd(i * 4.4) * Math.PI * 2;
              x = x + (tg.x + Math.cos(a) * r - x) * q;
              y = y + (tg.y + Math.sin(a) * r - y) * q;
            }
            const rad = 1.4 + rnd(i * 2.2) * 2.4;
            const op = 0.35 + rnd(i * 6.6) * 0.65;
            return <circle key={i} cx={x} cy={y} r={rad} fill={i % 9 === 0 ? pal.text : color} opacity={op} />;
          })}
        </g>
        {props.split
          ? props.split.map((tg, k) => {
              const p = interpolate(frame, [splitBeat + 4 + k * 3, splitBeat + 12 + k * 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return tg.label ? (
                <text key={k} x={tg.x} y={tg.y + 108} textAnchor="middle" fontFamily={theme.mono} fontSize={30} fontWeight={700} fill={pal.text} opacity={p}>
                  {tg.label}
                </text>
              ) : null;
            })
          : null}
      </svg>
      {props.label ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 770,
            textAlign: 'center',
            fontFamily: theme.font,
            opacity: interpolate(frame, [revealFrame(beats, 1) - LEAD_FRAMES, revealFrame(beats, 1) + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (frame < splitBeat - 10 ? 1 : 0),
          }}
        >
          <div style={{fontSize: 70, fontWeight: 800, color: pal.text, letterSpacing: -2, textShadow: `0 0 40px ${rgba(color, 0.5)}`}}>{props.label}</div>
          {props.sublabel ? <div style={{fontSize: 30, fontWeight: 700, letterSpacing: 6, color, marginTop: 6}}>{props.sublabel}</div> : null}
        </div>
      ) : null}
      <div style={{display: 'none'}}>{durationInFrames}</div>
    </Stage>
  );
};

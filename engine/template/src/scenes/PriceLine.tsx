import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, rnd, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A jittery line that draws across the scene (an illustration of noise, not data).
 * Beat 0 = label, last beat = the line greys out and gets struck through with `strike` text.
 */
type P = {label?: string; strike?: string; seed?: number};

export const PriceLine: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const N = 90;
  const seed = props.seed ?? 3;
  let v = 0;
  const pts = Array.from({length: N}).map((_, i) => {
    v += (rnd(i * 7.3 + seed) - 0.5) * 34;
    v *= 0.94;
    return {x: 40 + (i / (N - 1)) * 920, y: 430 + v + Math.sin(i / 5) * 30};
  });
  const draw = interpolate(frame, [0, durationInFrames * 0.75], [0.15, 1], {extrapolateRight: 'clamp'});
  const shown = pts.slice(0, Math.max(2, Math.round(N * draw)));
  const d = shown.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const sb = revealFrame(beats, beats.length - 1) - LEAD_FRAMES;
  const s = interpolate(frame, [sb, sb + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lp = interpolate(frame, [revealFrame(beats, 0) - LEAD_FRAMES, revealFrame(beats, 0) + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tip = shown[shown.length - 1];
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`${d} L ${tip.x} 760 L 40 760 Z`} fill={rgba(s > 0 ? pal.dim : pal.accent, 0.12)} />
        <path d={d} fill="none" stroke={s > 0.3 ? pal.dim : pal.accent} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={tip.x} cy={tip.y} r={13} fill={s > 0.3 ? pal.dim : pal.accent} />
        {props.label ? (
          <text x={60} y={190} fontFamily={theme.font} fontSize={64} fontWeight={800} fill={pal.text} opacity={lp * (1 - s * 0.5)}>
            {props.label}
          </text>
        ) : null}
        {s > 0 ? (
          <g>
            <line x1={50} y1={168} x2={50 + 300 * s} y2={168} stroke={pal.alert} strokeWidth={9} strokeLinecap="round" />
            {props.strike ? (
              <text x={500} y={560} textAnchor="middle" fontFamily={theme.font} fontSize={92} fontWeight={800} fill={pal.alert} opacity={s} transform={`rotate(-6 500 560)`}>
                {props.strike}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
    </Stage>
  );
};

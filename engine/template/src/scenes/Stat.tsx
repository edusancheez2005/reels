import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Reveal, Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {theme, tone, alpha} from '../lib/theme';

type P = {value: number; prefix?: string; suffix?: string; decimals?: number; label?: string; tone?: 'accent' | 'alert'};

const COUNT_FRAMES = 18;

export const Stat: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const land = revealFrame(beats, 0); // the number finishes counting on beat 0
  const start = Math.max(0, land - COUNT_FRAMES) - LEAD_FRAMES;
  const t = interpolate(frame, [start, land], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const n = props.value * t;
  const d = props.decimals ?? (Number.isInteger(props.value) ? 0 : 1);
  const txt = n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const color = tone(props.tone ?? 'accent');
  const settle = interpolate(frame, [land - 2, land + 4], [1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, fontFamily: theme.font}}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 210,
            letterSpacing: -6,
            color,
            opacity: frame >= start ? 1 : 0,
            transform: `scale(${settle})`,
            textShadow: `0 0 60px ${alpha(color, 0.35)}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {props.prefix ?? ''}
          {txt}
          {props.suffix ?? ''}
        </div>
        {props.label ? (
          <Reveal beats={beats} i={1}>
            <div style={{fontWeight: 700, fontSize: 56, color: theme.muted, textAlign: 'center', maxWidth: 900}}>{props.label}</div>
          </Reveal>
        ) : null}
      </div>
    </Stage>
  );
};

import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, Reveal, type SceneProps} from '../lib/anim';
import {usePal, toneOf, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

type P = {
  value: number;
  /** count up from this value instead of 0 (e.g. start a $600M count at $500M) */
  from?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  logo?: string;
  chip?: string;
  label?: string;
  tone?: 'accent' | 'good' | 'alert' | 'text';
};

/**
 * A big number that counts up. Beats: [start counting (logo + chip appear), land, label].
 * With a single beat the count lands on it.
 */
export const BigNumber: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const two = beats.length >= 2;
  const land = revealFrame(beats, two ? 1 : 0);
  const start = two ? revealFrame(beats, 0) - LEAD_FRAMES : land - 18 - LEAD_FRAMES;
  const t = interpolate(frame, [start, land], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const d = props.decimals ?? (Number.isInteger(props.value) ? 0 : 1);
  const txt = ((props.from ?? 0) + (props.value - (props.from ?? 0)) * t).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const color = props.tone === 'text' ? pal.text : toneOf(pal, props.tone ?? 'accent');
  const settle = interpolate(frame, [land - 2, land + 5], [1.07, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = interpolate(frame, [land - 1, land + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chars = (props.prefix ?? '').length + txt.length + (props.suffix ?? '').length * 0.55;
  const fs = Math.min(196, Math.floor(1560 / Math.max(6, chars)));
  const logoSrc = props.logo ? (props.logo.startsWith('http') ? props.logo : staticFile(props.logo)) : null;
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, fontFamily: theme.font}}>
        {logoSrc ? (
          <Reveal beats={beats} i={0} kind="pop">
            <div style={{width: 150, height: 150, borderRadius: 38, background: pal.name === 'dark' ? '#fff' : pal.panel, boxShadow: pal.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Img src={logoSrc} style={{width: 96, height: 96}} />
            </div>
          </Reveal>
        ) : null}
        <div
          style={{
            fontWeight: 800,
            fontSize: fs,
            letterSpacing: -fs * 0.035,
            color,
            opacity: frame >= start ? 1 : 0,
            transform: `scale(${settle})`,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 ${30 + 50 * flash}px ${rgba(color, 0.25 + 0.35 * flash)}`,
            whiteSpace: 'nowrap',
          }}
        >
          {props.prefix ?? ''}
          {txt}
          <span style={{fontSize: fs * 0.49, letterSpacing: -2, marginLeft: 10}}>{props.suffix ?? ''}</span>
        </div>
        {props.chip ? (
          <Reveal beats={beats} i={0}>
            <div style={{fontFamily: theme.mono, fontSize: 32, color: pal.muted, padding: '14px 26px', borderRadius: 999, border: `2px solid ${pal.line}`, background: pal.panel}}>
              {props.chip}
            </div>
          </Reveal>
        ) : null}
        {props.label ? (
          <Reveal beats={beats} i={two ? 2 : 1}>
            <div style={{fontWeight: 600, fontSize: 46, color: pal.muted, textAlign: 'center', maxWidth: 900}}>{props.label}</div>
          </Reveal>
        ) : null}
      </div>
    </Stage>
  );
};

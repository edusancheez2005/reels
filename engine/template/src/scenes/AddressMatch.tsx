import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, ramp, revealFrame, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal, rgba} from '../lib/palette';

/**
 * AddressMatch (3 Nov 2026, address-poisoning reel): two crypto addresses, one under the other, typed out
 * character by character, then the matching ends light up and the different middle flashes red.
 * Beats: [0 first address types in, 1 second types in, 2 matching ends glow, 3 middle marked different].
 * Props: a {label, text, tone}, b {label, text, tone}, start (matching chars after the prefix, 3), end (4),
 * prefix ("0x"), split (chars per line, 21), endLabel, midLabel, size (52).
 */
type Addr = {label: string; text: string; tone?: 'good' | 'alert' | 'accent' | 'muted'};
type P = {a: Addr; b: Addr; start?: number; end?: number; prefix?: string; split?: number; endLabel?: string; midLabel?: string; size?: number};

export const AddressMatch: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const frame = useCurrentFrame();
  const push = usePushIn(durationInFrames, 1.05);
  const prefix = props.prefix ?? '0x';
  const nS = prefix.length + (props.start ?? 3);
  const nE = props.end ?? 4;
  const split = props.split ?? 21;
  const size = props.size ?? 52;
  const cw = size * 0.6;
  const fr = (i: number) => (beats.length > i ? revealFrame(beats, i) : 9999);
  const endsP = ramp(frame, fr(2) - 2, fr(2) + 8, Easing.out(Easing.cubic));
  const midP = ramp(frame, fr(3) - 2, fr(3) + 8, Easing.out(Easing.cubic));
  const toneC = (t?: string) => (t === 'alert' ? pal.alert : t === 'good' ? pal.good : t === 'muted' ? pal.muted : pal.accent);

  const block = (ad: Addr, i: number) => {
    const t0 = fr(i) - 2;
    const typed = Math.floor(interpolate(frame, [t0, t0 + 16], [0, ad.text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    const show = ramp(frame, t0, t0 + 6);
    const lines = [ad.text.slice(0, split), ad.text.slice(split)];
    const col = toneC(ad.tone);
    return (
      <div key={i} style={{opacity: show, transform: `translateY(${(1 - show) * 30}px)`, marginBottom: 46}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: col, boxShadow: `0 0 18px ${col}`}} />
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 34, letterSpacing: 1, color: col}}>{ad.label}</div>
        </div>
        <div
          style={{
            background: pal.panel,
            border: `2px solid ${rgba(col, 0.55)}`,
            borderRadius: 22,
            padding: '22px 30px',
            boxShadow: pal.shadow,
            width: split * cw + 60,
          }}
        >
          {lines.map((ln, li) => (
            <div key={li} style={{display: 'flex', fontFamily: theme.mono, fontWeight: 700, fontSize: size, lineHeight: 1.32, height: size * 1.32}}>
              {ln.split('').map((ch, ci) => {
                const idx = li * split + ci;
                const isEnd = idx < nS || idx >= ad.text.length - nE;
                const isMid = !isEnd && idx >= nS;
                const on = idx < typed;
                const bg = isEnd ? rgba(pal.good, 0.32 * endsP) : isMid ? rgba(pal.alert, 0.22 * midP) : 'transparent';
                const c = isEnd && endsP > 0.05 ? pal.good : isMid && midP > 0.05 ? (i === 1 ? pal.alert : pal.text) : pal.text;
                return (
                  <span
                    key={ci}
                    style={{
                      width: cw,
                      textAlign: 'center',
                      color: c,
                      opacity: on ? (isMid && endsP > 0.5 && midP < 0.05 ? 0.45 : 1) : 0,
                      background: bg,
                      borderRadius: 6,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Stage push={push}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {block(props.a, 0)}
        {block(props.b, 1)}
        <div style={{display: 'flex', gap: 22, marginTop: 4}}>
          {props.endLabel ? (
            <div style={{opacity: endsP, transform: `scale(${0.8 + 0.2 * endsP})`, fontFamily: theme.font, fontWeight: 800, fontSize: 34, color: '#06140c', background: pal.good, borderRadius: 999, padding: '12px 26px'}}>
              {props.endLabel}
            </div>
          ) : null}
          {props.midLabel ? (
            <div style={{opacity: midP, transform: `scale(${0.8 + 0.2 * midP})`, fontFamily: theme.font, fontWeight: 800, fontSize: 34, color: '#fff', background: pal.alert, borderRadius: 999, padding: '12px 26px'}}>
              {props.midLabel}
            </div>
          ) : null}
        </div>
      </div>
    </Stage>
  );
};

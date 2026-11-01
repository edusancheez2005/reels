import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, Reveal, type SceneProps} from '../lib/anim';
import {usePal, toneOf, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

type P = {
  /** number of wheels (default 8) */
  digits?: number;
  /** where the counter starts (default 10^digits − 60) */
  from?: number;
  /** where it ends after rolling over (default 10^digits + 1, i.e. shows 00000001) */
  to?: number;
  /** small caption on the housing, e.g. "TOTAL OUT" */
  title?: string;
  /** the limit line above the wheels, e.g. "MAX IT CAN HOLD: 99,999,999" */
  max?: string;
  /** shown under the wheels after the roll-over (beat 1) */
  after?: string;
  afterTone?: 'accent' | 'good' | 'alert' | 'text';
  /** label on the last beat */
  label?: string;
  labelTone?: 'accent' | 'good' | 'alert' | 'text';
};

/**
 * Odometer — a mechanical mileage counter whose wheels roll, then roll over past the maximum to near zero
 * (integer overflow, "the counter wrapped around"). Beats: [counter appears and creeps up to the max, roll over, label].
 */
export const Odometer: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const n = props.digits ?? 8;
  const M = Math.pow(10, n);
  const from = props.from ?? M - 60;
  const to = props.to ?? M + 1;
  const b0 = revealFrame(beats, 0) - LEAD_FRAMES;
  const b1 = revealFrame(beats, Math.min(1, beats.length - 1));
  // creep up to just under the max, then the roll-over happens over ~16 frames on beat 1
  const near = M - 1 + 0.35;
  const v =
    frame < b1 - 4
      ? from + (near - from) * interpolate(frame, [b0, b1 - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)})
      : near + (to - near) * interpolate(frame, [b1 - 4, b1 + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const rolled = frame >= b1 + 6;
  const flash = interpolate(frame, [b1 + 6, b1 + 22], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shake = frame > b1 - 4 && frame < b1 + 14 ? Math.sin(frame * 2.3) * 3 : 0;

  const W = 96;
  const H = 150;
  const wheelPos = (i: number) => {
    // i = 0 is the rightmost wheel
    const p = Math.pow(10, i);
    const d = Math.floor(v / p) % 10;
    if (i === 0) return v % 10;
    const lower = v % p;
    const c = Math.max(0, lower - (p - 1));
    return d + c;
  };
  const accent = toneOf(pal, 'accent');
  const afterC = props.afterTone === 'text' ? pal.text : toneOf(pal, props.afterTone ?? 'good');
  const labelC = props.labelTone === 'text' ? pal.text : toneOf(pal, props.labelTone ?? 'accent');
  const wheels = Array.from({length: n}, (_, k) => n - 1 - k);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, fontFamily: theme.font}}>
        {props.max ? (
          <Reveal beats={beats} i={0}>
            <div style={{fontFamily: theme.mono, fontSize: 34, color: pal.muted, padding: '12px 24px', borderRadius: 999, border: `2px solid ${pal.line}`, background: pal.panel}}>{props.max}</div>
          </Reveal>
        ) : null}
        <div
          style={{
            transform: `translateX(${shake}px)`,
            padding: '30px 34px 22px',
            borderRadius: 34,
            background: 'linear-gradient(180deg, #2b2f36, #121418)',
            boxShadow: `0 30px 70px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.12), 0 0 ${60 * flash}px ${rgba(afterC, 0.6 * flash)}`,
            border: '3px solid #3a3f48',
          }}
        >
          <div style={{display: 'flex', gap: 10, padding: 12, borderRadius: 16, background: '#07080a', boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.9)'}}>
            {wheels.map((i) => {
              const pos = wheelPos(i);
              return (
                <div key={i} style={{width: W, height: H, overflow: 'hidden', position: 'relative', borderRadius: 8, background: i < 2 ? '#e9e4d8' : '#f6f3ec'}}>
                  <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - H / 2 - (pos % 10) * H}}>
                    {Array.from({length: 11}, (_, d) => (
                      <div key={d} style={{height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.mono, fontWeight: 800, fontSize: 112, color: '#15171b'}}>
                        {d % 10}
                      </div>
                    ))}
                  </div>
                  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55))'}} />
                </div>
              );
            })}
          </div>
          {props.title ? (
            <div style={{textAlign: 'center', marginTop: 14, fontFamily: theme.mono, fontSize: 26, letterSpacing: 6, color: '#9aa3ad'}}>{props.title}</div>
          ) : null}
        </div>
        <div style={{height: 70, display: 'flex', alignItems: 'center'}}>
          {props.after && rolled ? (
            <div style={{fontWeight: 800, fontSize: 56, color: afterC, opacity: interpolate(frame, [b1 + 6, b1 + 12], [0, 1], {extrapolateRight: 'clamp'}), textShadow: `0 0 30px ${rgba(afterC, 0.35)}`}}>{props.after}</div>
          ) : null}
        </div>
        {props.label ? (
          <Reveal beats={beats} i={Math.max(2, beats.length - 1)}>
            <div style={{fontWeight: 700, fontSize: 48, color: labelC, textAlign: 'center', maxWidth: 860, padding: '14px 28px', borderRadius: 22, background: rgba(labelC, 0.1), border: `2px solid ${rgba(labelC, 0.4)}`}}>{props.label}</div>
          </Reveal>
        ) : null}
        <div style={{display: 'none', color: accent}} />
      </div>
    </Stage>
  );
};

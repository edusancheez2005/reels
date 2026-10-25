import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, Reveal, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, toneOf, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A titled list of rows (e.g. addresses + amounts). Beat 0 = title/counter, then one row per beat;
 * the beat after the last row stamps every row's badge in quick succession.
 */
type Row = {left: string; right?: string; badge?: string; tone?: string};
type P = {title?: string; counter?: {to: number; suffix?: string}; rows: Row[]; note?: string};

export const Checklist: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const n = props.rows.length;
  const c0 = revealFrame(beats, 0) - LEAD_FRAMES;
  const cnt = props.counter ? Math.round(interpolate(frame, [c0, c0 + 22], [0, props.counter.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})) : 0;
  const stamp = revealFrame(beats, n + 1) - LEAD_FRAMES;
  return (
    <Stage>
      <div style={{position: 'absolute', left: 40, right: 40, top: 40, fontFamily: theme.font}}>
        <Reveal beats={beats} i={0}>
          <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22, marginBottom: 34}}>
            {props.counter ? <div style={{fontSize: 120, fontWeight: 800, color: pal.text, letterSpacing: -4, fontVariantNumeric: 'tabular-nums'}}>{cnt}<span style={{fontSize: 56, color: pal.muted, marginLeft: 10}}>{props.counter.suffix ?? ''}</span></div> : null}
            {props.title ? <div style={{fontSize: 44, fontWeight: 700, color: pal.muted}}>{props.title}</div> : null}
          </div>
        </Reveal>
        {props.rows.map((r, i) => {
          const sp = interpolate(frame, [stamp + i * 2, stamp + i * 2 + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
          const color = toneOf(pal, r.tone ?? 'good');
          return (
            <Reveal key={i} beats={beats} i={1 + i} kind="left">
              <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 28px', marginBottom: 14, borderRadius: 22, background: pal.panel, border: `1.5px solid ${pal.line}`, boxShadow: pal.name === 'light' ? '0 8px 24px rgba(0,0,0,0.06)' : 'none'}}>
                <div style={{flex: 1, fontFamily: theme.mono, fontSize: 38, fontWeight: 600, color: pal.text}}>{r.left}</div>
                {r.right ? <div style={{fontFamily: theme.mono, fontSize: 36, fontWeight: 700, color: pal.muted}}>{r.right}</div> : null}
                {r.badge ? (
                  <div style={{width: 168, textAlign: 'center', padding: '10px 0', borderRadius: 14, fontWeight: 800, fontSize: 26, letterSpacing: 2, color, border: `3px solid ${color}`, background: rgba(color, 0.12), opacity: sp, transform: `scale(${interpolate(sp, [0, 1], [1.8, 1])}) rotate(${(1 - sp) * -10}deg)`}}>
                    {r.badge}
                  </div>
                ) : null}
              </div>
            </Reveal>
          );
        })}
        {props.note ? <div style={{textAlign: 'center', marginTop: 18, fontSize: 26, fontWeight: 600, color: pal.muted, opacity: interpolate(frame, [stamp + 8, stamp + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{props.note}</div> : null}
      </div>
    </Stage>
  );
};

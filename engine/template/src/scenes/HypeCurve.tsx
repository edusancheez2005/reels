import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, ramp, revealFrame, rnd, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal, rgba, toneOf} from '../lib/palette';

/**
 * HypeCurve (4 Nov 2026, meme-coin reel): the shape of a hype cycle, as a diagram (not data).
 * A queue of buyer dots walks in along the bottom and the price line climbs with them; on `stop` the queue
 * runs dry ("new buyers: 0"); on `fall` the line plunges and turns red.
 * actions[i] fire on beat i: `rise`, `stop`, `fall`, `label:<n>`. Props: priceLabel, buyersLabel, stopLabel,
 * note (small corner text, e.g. "the pattern · not real data"), labels [{text, x, y, tone}] (stage px), risen (start at the peak).
 */
type Lbl = {text: string; x: number; y: number; tone?: string};
type P = {priceLabel?: string; buyersLabel?: string; stopLabel?: string; note?: string; labels?: Lbl[]; risen?: boolean; actions?: string[]};

const X0 = 90;
const XP = 610;
const X1 = 930;
const YB = 660;
const YP = 170;

export const HypeCurve: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const frame = useCurrentFrame();
  const push = usePushIn(durationInFrames, 1.04);
  const acts = props.actions ?? ['rise'];
  const at = (name: string) => {
    const i = acts.indexOf(name);
    return i < 0 ? 99999 : revealFrame(beats, i);
  };
  const riseF = props.risen ? -80 : at('rise');
  const stopF = at('stop');
  const fallF = at('fall');
  const riseEnd = Math.min(stopF < 99999 ? stopF + 4 : riseF + 40, riseF + 60);
  const rise = ramp(frame, riseF, riseEnd, Easing.out(Easing.quad));
  const fall = ramp(frame, fallF, fallF + 16, Easing.in(Easing.cubic));

  // rising leg: wiggly climb to the peak; falling leg: a steep drop
  const N = 60;
  const up = Array.from({length: N}).map((_, i) => {
    const t = i / (N - 1);
    const x = X0 + t * (XP - X0);
    const y = YB - (YB - YP) * Math.pow(t, 1.6) + Math.sin(t * 19) * 14 * (1 - t) + (rnd(i * 4.1) - 0.5) * 10;
    return [x, y];
  });
  const M = 24;
  const down = Array.from({length: M}).map((_, i) => {
    const t = (i + 1) / M;
    const x = XP + t * (X1 - XP);
    const y = YP + (YB - 20 - YP) * Math.pow(t, 0.55) + (rnd(i * 7.7) - 0.5) * 12;
    return [x, y];
  });
  const upN = Math.max(2, Math.round(N * rise));
  const downN = Math.round(M * fall);
  const pts = [...up.slice(0, upN), ...(rise >= 0.999 ? down.slice(0, downN) : [])];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const tip = pts[pts.length - 1];
  const lineCol = fall > 0.05 ? pal.alert : pal.good;

  // buyer queue along the bottom: dots walk right into the chart while buying lasts
  const Q = 16;
  const stopP = ramp(frame, stopF, stopF + 14);
  const queue = Array.from({length: Q}).map((_, i) => {
    const speed = 5.2;
    const pos = ((frame - riseF) * speed + i * (520 / Q)) % 520;
    const x = 60 + pos;
    const alive = frame >= riseF ? 1 : 0;
    // after stop, dots that haven't entered yet disappear (no more new buyers)
    const gone = stopP * (1 - Math.min(1, pos / 520));
    const op = alive * (1 - gone) * interpolate(pos, [0, 30, 470, 520], [0, 1, 1, 0]);
    return <div key={i} style={{position: 'absolute', left: x, top: 790, width: 26, height: 26, borderRadius: 13, background: pal.accent, opacity: op, boxShadow: `0 0 10px ${rgba(pal.accent, 0.6)}`}} />;
  });

  return (
    <Stage push={push}>
      <svg width={1000} height={900} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={X0} y1={YB + 30} x2={X1 + 20} y2={YB + 30} stroke={pal.line} strokeWidth={3} />
        <line x1={X0} y1={110} x2={X0} y2={YB + 30} stroke={pal.line} strokeWidth={3} />
        <path d={d} fill="none" stroke={lineCol} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${rgba(lineCol, 0.55)})`}} />
        {tip ? <circle cx={tip[0]} cy={tip[1]} r={14} fill={lineCol} /> : null}
      </svg>
      {props.priceLabel ? (
        <div style={{position: 'absolute', left: X0 + 18, top: 100, fontFamily: theme.font, fontWeight: 800, fontSize: 36, color: pal.muted}}>{props.priceLabel}</div>
      ) : null}
      {props.note ? (
        <div style={{position: 'absolute', right: 50, top: 100, fontFamily: theme.font, fontWeight: 700, fontSize: 26, color: pal.muted}}>{props.note}</div>
      ) : null}
      {queue}
      {props.buyersLabel ? (
        <div style={{position: 'absolute', left: 60, top: 832, fontFamily: theme.font, fontWeight: 800, fontSize: 32, color: pal.accent, opacity: ramp(frame, riseF, riseF + 8) * (1 - stopP)}}>{props.buyersLabel}</div>
      ) : null}
      {props.stopLabel ? (
        <div style={{position: 'absolute', left: 60, top: 770, opacity: stopP, transform: `scale(${0.85 + 0.15 * stopP})`, transformOrigin: 'left center'}}>
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 40, color: '#fff', background: pal.alert, borderRadius: 999, padding: '12px 28px'}}>{props.stopLabel}</div>
        </div>
      ) : null}
      {(props.labels ?? []).map((l, n) => {
        const f = at(`label:${n}`);
        const p = ramp(frame, f, f + 8);
        const c = toneOf(pal, l.tone ?? 'accent');
        return (
          <div key={n} style={{position: 'absolute', left: l.x, top: l.y, transform: `translate(-50%, ${(1 - p) * 16}px)`, opacity: p}}>
            <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 36, color: l.tone === 'alert' ? '#fff' : '#06121a', background: c, borderRadius: 999, padding: '12px 26px', whiteSpace: 'nowrap'}}>{l.text}</div>
          </div>
        );
      })}
    </Stage>
  );
};

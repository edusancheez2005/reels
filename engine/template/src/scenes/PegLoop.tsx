import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, ramp, revealFrame, rnd, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal, rgba, toneOf} from '../lib/palette';

/**
 * PegLoop (13 Nov 2026, Terra/Luna reel): an algorithmic stablecoin's swap loop as a 2D machine.
 * Left: the stablecoin (e.g. UST) with its price tag. Middle: the swap ("1 UST → $1 of new LUNA"). Right: the
 * second coin (LUNA) with its price tag. Bottom: a field of dots = the second coin's supply, which multiplies on `run`.
 * actions[i] fire on beat i:
 *   `swap`   one stablecoin token rides into the machine and comes out as a new LUNA token
 *   `dip`    the stablecoin tag flips to `dipText` (red)
 *   `arb`    a trader token makes the trip and the tag flips back to `ustText` (green), "+profit" floats up
 *   `run`    a stream of tokens pours through, arrows turn red, supply dots multiply, tags flip to `runUstText` / `lunaToText`
 *   `crash`  the LUNA tag flips to `lunaToText` on this beat (default: shortly after `run`)
 *   `supply` the supply stamp (`supply.text`) lands over the dot field
 *   `label:<n>` shows labels[n] (stage px, centred)
 * Props: stable ("UST"), other ("LUNA"), ustText ("$1.00"), ustTone (good|alert), dipText, runUstText, lunaText, lunaToText, swapText,
 *   supply {text, label}, labels [{text, x, y, tone}], note, ran (start in the post-run state).
 * Prices are shown as tag flips between sourced values, never as a counter with in-between numbers.
 */
type Lbl = {text: string; x: number; y: number; tone?: string; size?: number};
type P = {
  stable?: string; other?: string;
  ustText?: string; ustTone?: string; dipText?: string; runUstText?: string;
  lunaText?: string; lunaToText?: string;
  swapText?: string; backText?: string;
  supply?: {text: string; label?: string};
  labels?: Lbl[]; note?: string; ran?: boolean; actions?: string[];
};

const UX = 215;
const LX = 785;
const MX = 500;
let CY = 300; // set per render: higher when the supply field is shown
const R = 112;
const GOLD = '#F2B84B';

export const PegLoop: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const frame = useCurrentFrame();
  CY = props.supply ? 300 : 400;
  const push = usePushIn(durationInFrames, 1.04);
  const acts = props.actions ?? ['swap'];
  const at = (name: string) => {
    const i = acts.indexOf(name);
    return i < 0 ? 99999 : revealFrame(beats, i);
  };
  const swapF = at('swap');
  const dipF = at('dip');
  const arbF = at('arb');
  const runF = props.ran ? -200 : at('run');
  const supF = at('supply');
  const stable = props.stable ?? 'UST';
  const other = props.other ?? 'LUNA';

  const run = ramp(frame, runF, runF + 45, Easing.out(Easing.cubic));
  const running = frame >= runF;

  // ---- tags (flip between sourced values) ----
  type Tag = {text: string; tone: string; f: number};
  const ustStates: Tag[] = [{text: props.ustText ?? '$1.00', tone: props.ustTone ?? 'good', f: -999}];
  if (dipF < 99999) ustStates.push({text: props.dipText ?? '$0.98', tone: 'alert', f: dipF});
  if (arbF < 99999) ustStates.push({text: props.ustText ?? '$1.00', tone: 'good', f: arbF + 22});
  if (runF > -999 && (props.runUstText || props.ran)) ustStates.push({text: props.runUstText ?? '$0.20', tone: 'alert', f: runF + 18});
  const lunaStates: Tag[] = [{text: props.lunaText ?? '', tone: 'warm', f: -999}];
  const crashF = at('crash');
  if (props.lunaToText) lunaStates.push({text: props.lunaToText, tone: 'alert', f: crashF < 99999 ? crashF : runF + 30});

  const tagNode = (states: Tag[], x: number) => {
    const cur = [...states].reverse().find((s) => frame >= s.f) ?? states[0];
    if (!cur.text) return null;
    const flip = ramp(frame, cur.f, cur.f + 8);
    const col = cur.tone === 'good' ? pal.good : cur.tone === 'alert' ? pal.alert : GOLD;
    const sc = cur.f > -999 ? 0.8 + 0.2 * flip + 0.12 * Math.sin(Math.PI * flip) : 1;
    return (
      <div style={{position: 'absolute', left: x, top: CY + R + 34, transform: `translateX(-50%) scale(${sc})`}}>
        <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: 64, color: cur.tone === 'warm' ? '#1a1206' : '#fff', background: col, borderRadius: 22, padding: '8px 26px', whiteSpace: 'nowrap', boxShadow: `0 10px 30px ${rgba(col, 0.45)}`}}>{cur.text}</div>
      </div>
    );
  };

  // ---- coins ----
  const coin = (x: number, label: string, col: string, dark: boolean, shake = 0, dim = 0) => (
    <div style={{position: 'absolute', left: x - R + shake, top: CY - R, width: R * 2, height: R * 2, borderRadius: R,
      background: `radial-gradient(circle at 35% 30%, ${rgba('#ffffff', 0.55)}, ${col} 42%, ${rgba(col, 0.75)} 100%)`,
      border: `8px solid ${rgba('#ffffff', 0.35)}`, boxShadow: `0 0 ${40 - dim * 30}px ${rgba(col, 0.55 - dim * 0.4)}, inset 0 -10px 24px rgba(0,0,0,0.25)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', filter: dim ? `saturate(${1 - dim * 0.6}) brightness(${1 - dim * 0.35})` : undefined}}>
      <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: label.length > 3 ? 54 : 64, color: dark ? '#1a1206' : '#06121a', letterSpacing: 1}}>{label}</div>
    </div>
  );

  // ---- tokens travelling stable -> machine -> other ----
  const token = (p: number, key: string, scale = 1) => {
    if (p <= 0 || p >= 1) return null;
    const x = interpolate(p, [0, 1], [UX + 40, LX - 40]);
    const y = CY - Math.sin(p * Math.PI) * 30;
    const isNew = p > 0.5;
    const col = isNew ? GOLD : pal.accent;
    const s = 46 * scale * (isNew ? 1 : 1) * interpolate(p, [0, 0.42, 0.5, 0.58, 1], [1, 1, 0.2, 1, 1]);
    return <div key={key} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: s, background: col, border: '4px solid rgba(255,255,255,0.6)', boxShadow: `0 0 16px ${rgba(col, 0.8)}`}} />;
  };
  const trip = (f0: number, dur = 22) => ramp(frame, f0, f0 + dur, Easing.inOut(Easing.quad));
  const toks: React.ReactNode[] = [];
  if (swapF < 99999) toks.push(token(trip(swapF + 4), 'swap'));
  if (arbF < 99999) toks.push(token(trip(arbF + 4), 'arb'));
  if (running) {
    for (let k = 0; k < 40; k++) {
      const f0 = runF + k * 3.2 + rnd(k * 3.3) * 3;
      toks.push(token(trip(f0, 18), `run${k}`, 0.85));
    }
    // keep pouring for the rest of the scene
    const local = frame - (runF + 125);
    if (local >= 0) {
      for (let k = 0; k < 8; k++) {
        const ph = (local + k * 6) % 48;
        toks.push(token(Easing.inOut(Easing.quad)(Math.min(1, ph / 18)), `loop${k}`, 0.85));
      }
    }
  }

  // profit pop for arb
  const profP = ramp(frame, arbF + 22, arbF + 40);
  const profOp = arbF < 99999 ? interpolate(frame - arbF, [22, 28, 54, 64], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;

  // ---- arrows (the loop) ----
  const arrowCol = running ? pal.alert : pal.accent;
  const dash = -frame * (running ? 9 : 2.5);

  // ---- supply dot field ----
  const COLS = 28;
  const ROWS = 7;
  const N = COLS * ROWS;
  const baseN = 10;
  const shown = Math.round(baseN + (N - baseN) * run);

  const supP = ramp(frame, supF, supF + 10, Easing.out(Easing.back(1.6)));
  const ustDim = running ? ramp(frame, runF + 10, runF + 60) : 0;
  const lunaDim = running ? ramp(frame, runF + 25, runF + 70) : 0;
  const shake = running && frame < runF + 90 ? Math.sin(frame * 1.7) * 6 * (1 - ramp(frame, runF + 60, runF + 90)) : 0;

  return (
    <Stage push={push}>
      <svg width={1000} height={900} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <marker id="pl-head" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={arrowCol} />
          </marker>
        </defs>
        <path d={`M ${UX + 40} ${CY - R - 20} Q ${MX} ${CY - R - 150} ${LX - 40} ${CY - R - 20}`} fill="none" stroke={arrowCol} strokeWidth={8} strokeDasharray="22 16" strokeDashoffset={dash} markerEnd="url(#pl-head)" opacity={0.9} />
      </svg>
      {/* swap machine */}
      <div style={{position: 'absolute', left: MX - 95, top: CY - 70, width: 190, height: 140, borderRadius: 26, background: pal.panel2, border: `5px solid ${arrowCol}`,
        boxShadow: `0 0 ${running ? 40 + 20 * Math.sin(frame * 0.6) : 24}px ${rgba(arrowCol, 0.5)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: 40, color: pal.text, letterSpacing: 2}}>SWAP</div>
        <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 52, color: arrowCol, lineHeight: 1}}>⇄</div>
      </div>
      {props.swapText ? (
        <div style={{position: 'absolute', left: MX, top: CY - R - 150, transform: 'translateX(-50%)', fontFamily: theme.font, fontWeight: 800, fontSize: 38, color: pal.text, whiteSpace: 'nowrap', background: rgba(pal.bg, 0.85), padding: '6px 18px', borderRadius: 14}}>{props.swapText}</div>
      ) : null}
      {coin(UX, stable, pal.accent, false, shake, ustDim * 0.6)}
      {coin(LX, other, GOLD, true, -shake, lunaDim)}
      {toks}
      {tagNode(ustStates, UX)}
      {tagNode(lunaStates, LX)}
      {arbF < 99999 ? (
        <div style={{position: 'absolute', left: UX, top: CY - R - 60 - profP * 50, transform: 'translateX(-50%)', opacity: profOp, fontFamily: theme.font, fontWeight: 900, fontSize: 46, color: pal.good, whiteSpace: 'nowrap'}}>+2¢ profit</div>
      ) : null}
      {/* supply dots */}
      {props.supply ? <div style={{position: 'absolute', left: 70, top: 640, fontFamily: theme.font, fontWeight: 800, fontSize: 30, color: pal.muted}}>{props.supply?.label ?? `${other} coins in existence`}</div> : null}
      {props.supply ? Array.from({length: N}).map((_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        const order = i < baseN ? i : baseN + Math.floor(rnd(i * 1.37) * (N - baseN));
        const on = i < baseN || order < shown;
        const pop = on && i >= baseN ? ramp(frame, runF + (order / N) * 45, runF + (order / N) * 45 + 6) : on ? 1 : 0;
        return <div key={i} style={{position: 'absolute', left: 80 + c * 30.5, top: 690 + r * 26, width: 18, height: 18, borderRadius: 9, background: running && i >= baseN ? pal.alert : GOLD, opacity: pop * 0.95, transform: `scale(${pop})`}} />;
      }) : null}
      {props.supply?.text ? (
        <div style={{position: 'absolute', left: 500, top: 760, transform: `translate(-50%, -50%) scale(${supP}) rotate(-4deg)`, opacity: Math.min(1, supP)}}>
          <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: 64, color: '#fff', background: pal.alert, borderRadius: 18, padding: '10px 30px', whiteSpace: 'nowrap', border: '4px solid rgba(255,255,255,0.85)'}}>{props.supply.text}</div>
        </div>
      ) : null}
      {props.note ? (
        <div style={{position: 'absolute', right: 40, top: 878, fontFamily: theme.font, fontWeight: 700, fontSize: 24, color: pal.muted}}>{props.note}</div>
      ) : null}
      {(props.labels ?? []).map((l, n) => {
        const f = at(`label:${n}`);
        const p = ramp(frame, f, f + 8);
        const c = toneOf(pal, l.tone ?? 'accent');
        return (
          <div key={n} style={{position: 'absolute', left: l.x, top: l.y, transform: `translate(-50%, ${(1 - p) * 16}px)`, opacity: p}}>
            <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: l.size ?? 36, color: l.tone === 'alert' ? '#fff' : '#06121a', background: c, borderRadius: 999, padding: '10px 24px', whiteSpace: 'nowrap'}}>{l.text}</div>
          </div>
        );
      })}
    </Stage>
  );
};

import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, ramp, revealFrame, rnd, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal, rgba, toneOf} from '../lib/palette';

/**
 * CoinSwarm (4 Nov 2026, meme-coin reel): a crowd of coins that pops into existence, then mostly dies.
 * Two looks: `names` set → labelled tiles (a launch board of copycat coins, real names only); otherwise
 * small glowing coin dots (cols × rows; e.g. 700 dots = 7 million coins, 1 dot = 10,000).
 * actions[i] fire on beat i: `spawn` (tiles pop in, in a fast random wave, counter starts), `count` (counter lands),
 * `die` (all but the `keep` coins go grey and sink), `keep` (keep label pill), `you` (one coin lights up with `youLabel`),
 * `label:<n>` (show labels[n]).
 * Props: cols, rows, names[], keep (count kept, spread evenly; or index list), counter {to, prefix, suffix, label},
 * keepLabel, youLabel, youIndex, title (small chip above), labels [{text, tone}], tone (accent|good|warm…), formed (start spawned).
 */
type Lbl = {text: string; tone?: string};
type P = {
  cols?: number;
  rows?: number;
  names?: string[];
  keep?: number | number[];
  counter?: {to: number; prefix?: string; suffix?: string; label?: string};
  keepLabel?: string;
  youLabel?: string;
  youIndex?: number;
  title?: string;
  labels?: Lbl[];
  tone?: string;
  formed?: boolean;
  actions?: string[];
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export const CoinSwarm: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const frame = useCurrentFrame();
  const push = usePushIn(durationInFrames, 1.04);
  const acts = props.actions ?? ['spawn'];
  const at = (name: string) => {
    const i = acts.indexOf(name);
    return i < 0 ? 99999 : revealFrame(beats, i);
  };
  const tiles = !!props.names?.length;
  const cols = props.cols ?? (tiles ? 6 : 25);
  const rows = props.rows ?? (tiles ? 6 : 28);
  const N = cols * rows;
  const keepSet = new Set<number>(
    Array.isArray(props.keep)
      ? props.keep
      : Array.from({length: props.keep ?? 0}).map((_, j) => {
          const base = Math.floor(((j + 0.5) * N) / (props.keep as number));
          return Math.min(N - 1, base + Math.floor((rnd(j * 3.1) - 0.5) * (N / ((props.keep as number) * 2))));
        }),
  );
  const tone = toneOf(pal, props.tone ?? 'accent');
  const spawnF = props.formed ? -60 : at('spawn');
  const countF = at('count') < 99999 ? at('count') : spawnF + 24;
  const dieF = at('die');
  const keepF = at('keep');
  const youF = at('you');

  // grid geometry inside the 1000×900 stage
  const top = props.counter || props.title ? 190 : 70;
  const bottom = 800;
  const left = 40;
  const right = 960;
  const cw = (right - left) / cols;
  const ch = (bottom - top) / rows;

  const cnt = props.counter;
  const cntV = cnt ? interpolate(frame, [spawnF, countF], [0, cnt.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 0;

  const cells = Array.from({length: N}).map((_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const order = rnd(i * 1.7 + 0.3);
    const t0 = spawnF + order * 22;
    const sp = ramp(frame, t0, t0 + 7, Easing.out(Easing.back(1.6)));
    const kept = keepSet.has(i);
    const dd = ramp(frame, dieF + rnd(i * 2.9) * 12, dieF + rnd(i * 2.9) * 12 + 10);
    const die = kept ? 0 : dd;
    const keepGlow = kept ? ramp(frame, dieF + 4, dieF + 16) : 0;
    const you = props.youIndex === i ? ramp(frame, youF, youF + 9, Easing.out(Easing.back(1.8))) : 0;
    const x = left + c * cw + cw / 2;
    const y = top + r * ch + ch / 2 + die * 26;
    const col = you > 0.05 ? pal.alert : die > 0.5 ? pal.dim : tone;
    const op = sp * (1 - die * 0.78);
    const sc = sp * (1 + keepGlow * 0.35 + you * 0.6) * (1 - die * 0.25);
    if (tiles) {
      const name = props.names![i % props.names!.length];
      const w = cw * 0.9;
      const h = ch * 0.84;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            opacity: op,
            transform: `scale(${sc})`,
            borderRadius: 16,
            background: pal.panel,
            border: `2px solid ${rgba(col, 0.6 + keepGlow * 0.4)}`,
            boxShadow: keepGlow > 0 ? `0 0 ${30 * keepGlow}px ${rgba(col, 0.6)}` : pal.shadow,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: h * 0.36,
              height: h * 0.36,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${rgba('#ffffff', 0.5)}, ${col} 55%, ${rgba(col, 0.7)})`,
              boxShadow: `0 0 12px ${rgba(col, 0.5)}`,
            }}
          />
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: Math.min(24, (w / Math.max(6, name.length)) * 1.45), color: die > 0.5 ? pal.muted : pal.text, whiteSpace: 'nowrap'}}>
            {name}
          </div>
        </div>
      );
    }
    const d = Math.min(cw, ch) * 0.72;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x - d / 2,
          top: y - d / 2,
          width: d,
          height: d,
          borderRadius: '50%',
          opacity: op,
          transform: `scale(${sc})`,
          background: `radial-gradient(circle at 35% 30%, ${rgba('#ffffff', 0.55)}, ${col} 60%)`,
          boxShadow: keepGlow > 0 || you > 0 ? `0 0 ${10 + 14 * Math.max(keepGlow, you)}px ${col}` : 'none',
        }}
      />
    );
  });

  const pill = (text: string, p: number, bg: string, fg: string, y: number) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 38, color: fg, background: bg, borderRadius: 999, padding: '14px 30px', maxWidth: 900, textAlign: 'center', boxShadow: pal.shadow}}>{text}</div>
    </div>
  );

  const youIdx = props.youIndex ?? -1;
  const youP = youIdx >= 0 ? ramp(frame, youF, youF + 9) : 0;

  return (
    <Stage push={push}>
      {props.title ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: cnt ? 0 : 60, display: 'flex', justifyContent: 'center', opacity: ramp(frame, spawnF, spawnF + 8)}}>
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: pal.muted, textTransform: 'uppercase'}}>{props.title}</div>
        </div>
      ) : null}
      {cnt ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: props.title ? 40 : 10, textAlign: 'center', opacity: ramp(frame, spawnF, spawnF + 6)}}>
          <span style={{fontFamily: theme.font, fontWeight: 800, fontSize: 104, color: pal.text, letterSpacing: -2}}>
            {cnt.prefix ?? ''}
            {fmt(cntV)}
            {cnt.suffix ?? ''}
          </span>
          {cnt.label ? <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 32, color: pal.muted, marginTop: -6}}>{cnt.label}</div> : null}
        </div>
      ) : null}
      {cells}
      {youIdx >= 0 && props.youLabel ? (
        <div
          style={{
            position: 'absolute',
            left: left + (youIdx % cols) * cw + cw / 2 - 150,
            top: top + Math.floor(youIdx / cols) * ch - 70,
            width: 300,
            display: 'flex',
            justifyContent: 'center',
            opacity: youP,
          }}
        >
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 36, color: '#fff', background: pal.alert, borderRadius: 999, padding: '10px 24px'}}>{props.youLabel}</div>
        </div>
      ) : null}
      {props.keepLabel ? pill(props.keepLabel, ramp(frame, keepF, keepF + 8), pal.good, '#06140c', 818) : null}
      {(props.labels ?? []).map((l, n) => {
        const f = at(`label:${n}`);
        return <React.Fragment key={n}>{pill(l.text, ramp(frame, f, f + 8), toneOf(pal, l.tone ?? 'accent'), l.tone === 'alert' ? '#fff' : '#06121a', 818 - n * 0)}</React.Fragment>;
      })}
    </Stage>
  );
};

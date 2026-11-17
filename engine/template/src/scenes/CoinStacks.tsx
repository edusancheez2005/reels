import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Stage, ramp, revealFrame, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal, rgba, toneOf} from '../lib/palette';

/**
 * CoinStacks (17 Nov 2026, who-holds-bitcoin reel): "who owns how much" as piles of gold coins, side by side, to scale.
 * One coin = `unit` (e.g. 50,000 BTC). Each stack builds coin by coin on its beat, its number lands above it, its name below.
 * actions[i] fire on beat i:
 *   `add:<k>`   stack k builds (coins drop in fast, bottom first), number + label appear
 *   `hi:<k>`    spotlight stack k (others dim), ring under it
 *   `all`       clear the spotlight
 *   `cust:<k>`  stack k's coins above its `own` count turn blue ("customers'") with `custLabel`; the gold base keeps `ownLabel`
 *   `move:<k>`  the top `moveCount` coins of stack k lift off and fly into the "your wallet" slot (`wallet` {x, label})
 *   `beat:<k>`  stack k's top coin bounces (an accent on a word)
 *   `label:<n>` show labels[n] (pill)
 * Props: stacks [{label, sub, value, display, tone (accent|warm|good|alert|muted), est (dashed "estimate" look), own, logo}],
 *   unit, built (stack indices already standing at the start, for continuity between scenes), title (chip at top),
 *   labels [{text, tone, y}], custLabel, ownLabel, wallet {x, label}, moveCount, maxCoins (scale; default = tallest stack).
 * Numbers are sourced values (display text), never in-between counters.
 */
type Stack = {label: string; sub?: string; value: number; display?: string; tone?: string; est?: boolean; own?: number; logo?: string};
type Lbl = {text: string; tone?: string; y?: number};
type P = {
  stacks: Stack[];
  unit?: number;
  built?: number[];
  title?: string;
  labels?: Lbl[];
  custLabel?: string;
  ownLabel?: string;
  wallet?: {x?: number; label?: string};
  moveCount?: number;
  maxCoins?: number;
  actions?: string[];
};

const GOLD = '#F5B638';
const GOLD_D = '#B9800F';
const GOLD_L = '#FFD978';
const BLUE = '#4F8CFF';
const BLUE_D = '#2556B8';
const BLUE_L = '#9CC0FF';

export const CoinStacks: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const frame = useCurrentFrame();
  const push = usePushIn(durationInFrames, 1.03);
  const acts = props.actions ?? [];
  const at = (name: string) => {
    const i = acts.indexOf(name);
    return i < 0 ? 99999 : revealFrame(beats, i);
  };
  const unit = props.unit ?? 50000;
  const stacks = props.stacks;
  const n = stacks.length;
  const coins = stacks.map((s) => Math.max(1, Math.round(s.value / unit)));
  const maxC = props.maxCoins ?? Math.max(...coins);
  const hasWallet = acts.some((a) => a.startsWith('move:'));
  const left = 70;
  const right = hasWallet ? 760 : 880;
  const span = (right - left) / n;
  const W = Math.min(170, span * 0.78);
  const EH = W * 0.3; // ellipse height of a coin face
  const BASE = 800;
  const T = Math.min(26, 560 / maxC); // coin thickness
  const built = new Set(props.built ?? []);

  // spotlight state: last hi/all action before now
  let hiIdx = -1;
  acts.forEach((a, i) => {
    const f = revealFrame(beats, i);
    if (f <= frame) {
      if (a.startsWith('hi:')) hiIdx = Number(a.slice(3));
      if (a === 'all') hiIdx = -1;
    }
  });
  const hiF = (() => {
    let f = -999;
    acts.forEach((a, i) => {
      const fr = revealFrame(beats, i);
      if (fr <= frame && (a.startsWith('hi:') || a === 'all')) f = fr;
    });
    return f;
  })();
  const hiP = ramp(frame, hiF, hiF + 8);

  const wx = props.wallet?.x ?? 870;
  const walletShow = hasWallet ? ramp(frame, Math.min(...acts.map((a, i) => (a.startsWith('move:') ? revealFrame(beats, i) : 99999))) - 10, Math.min(...acts.map((a, i) => (a.startsWith('move:') ? revealFrame(beats, i) : 99999)))) : 0;

  const coin = (key: string, cx: number, y: number, w: number, top: string, side: string, rim: string, op: number, dashed = false) => (
    <g key={key} opacity={op}>
      <path
        d={`M ${cx - w / 2} ${y} L ${cx - w / 2} ${y + T * 0.92} A ${w / 2} ${EH / 2} 0 0 0 ${cx + w / 2} ${y + T * 0.92} L ${cx + w / 2} ${y} Z`}
        fill={side}
        stroke={dashed ? rim : 'none'}
        strokeDasharray={dashed ? '6 6' : undefined}
        strokeWidth={dashed ? 2 : 0}
      />
      <ellipse cx={cx} cy={y} rx={w / 2} ry={EH / 2} fill={top} stroke={rim} strokeWidth={2} strokeDasharray={dashed ? '6 6' : undefined} />
      <ellipse cx={cx} cy={y} rx={w * 0.34} ry={EH * 0.34} fill="none" stroke={rgba('#ffffff', 0.35)} strokeWidth={2} />
    </g>
  );

  const els: React.ReactNode[] = [];
  const tops: {x: number; y: number}[] = [];
  stacks.forEach((s, k) => {
    const cx = left + span * (k + 0.5);
    const addF = built.has(k) ? -100 : at(`add:${k}`);
    const custF = at(`cust:${k}`);
    const moveF = at(`move:${k}`);
    const bounceF = at(`beat:${k}`);
    const c = coins[k];
    const dim = hiIdx >= 0 && hiIdx !== k ? 1 - 0.7 * hiP : hiIdx === k ? 1 : 1 - 0.7 * (1 - hiP) * 0;
    const own = s.own ?? c;
    const moveN = Math.min(c, props.moveCount ?? 3);
    const est = !!s.est;
    const tone = s.tone ?? 'warm';
    for (let j = 0; j < c; j++) {
      const per = Math.min(2.2, 30 / c);
      const st = addF + j * per;
      const p = interpolate(frame, [st, st + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      if (p <= 0) continue;
      let y = BASE - j * T - (1 - p) * 140;
      let x = cx;
      let w = W;
      const isTop = j === c - 1;
      if (isTop && bounceF < 99999) y -= Math.sin(Math.min(1, Math.max(0, (frame - bounceF) / 10)) * Math.PI) * 26;
      const blue = custF < 99999 && j >= own ? ramp(frame, custF + (j - own) * 0.8, custF + (j - own) * 0.8 + 8) : 0;
      // moving coins: top moveN coins fly to the wallet slot
      const mi = c - 1 - j; // 0 = top coin
      if (moveF < 99999 && mi < moveN) {
        const ms = moveF + mi * 5;
        const mp = interpolate(frame, [ms, ms + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
        const tx = wx;
        const ty = BASE - (moveN - 1 - mi) * T;
        x = cx + (tx - cx) * mp;
        y = y + (ty - y) * mp - Math.sin(mp * Math.PI) * 160;
        w = W + (Math.min(130, W) - W) * mp;
      }
      let top = GOLD_L;
      let side = GOLD;
      let rim = GOLD_D;
      if (tone === 'muted' || est) {
        top = '#E9D9A8';
        side = '#C9B27A';
        rim = '#9C8650';
      }
      if (tone === 'alert') {
        top = '#FF9A8A';
        side = '#F05A47';
        rim = '#A92F22';
      }
      if (blue > 0) {
        const mix = (a: string, b: string) => {
          const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
          const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
          return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * blue)).join(',')})`;
        };
        top = mix(top, BLUE_L);
        side = mix(side, BLUE);
        rim = mix(rim, BLUE_D);
      }
      els.push(coin(`${k}-${j}`, x, y, w, top, side, rim, Math.min(1, p * 1.5) * dim, est));
      if (isTop) tops.push({x: cx, y: BASE - j * T});
    }
    const lp = ramp(frame, addF + Math.min(30, c * 2.2), addF + Math.min(30, c * 2.2) + 8);
    if (lp > 0) {
      const topY = BASE - (c - 1) * T - EH / 2;
      const col = toneOf(pal, tone === 'warm' ? 'text' : tone);
      els.push(
        <g key={`lbl-${k}`} opacity={lp * dim}>
          <text x={cx} y={topY - 22 - (1 - lp) * 16} textAnchor="middle" fontFamily={theme.font} fontSize={Math.min(50, span * 0.3)} fontWeight={800} fill={col}>
            {s.display ?? s.value.toLocaleString('en-US')}
          </text>
          {s.logo ? null : null}
          <text x={cx} y={BASE + EH / 2 + 50} textAnchor="middle" fontFamily={theme.font} fontSize={Math.min(36, span * 0.24)} fontWeight={800} fill={pal.text}>
            {s.label}
          </text>
          {s.sub ? (
            <text x={cx} y={BASE + EH / 2 + 88} textAnchor="middle" fontFamily={theme.font} fontSize={Math.min(28, span * 0.2)} fontWeight={600} fill={pal.muted}>
              {s.sub}
            </text>
          ) : null}
        </g>,
      );
    }
    if (hiIdx === k && hiP > 0) {
      els.unshift(<ellipse key={`ring-${k}`} cx={cx} cy={BASE + T} rx={(W / 2 + 26) * hiP} ry={(EH / 2 + 12) * hiP} fill="none" stroke={pal.accent} strokeWidth={5} opacity={hiP} />);
    }
  });

  // customers / own pills for cust: stacks
  const pill = (key: string, text: string, x: number, y: number, p: number, bg: string, fg: string) => {
    if (p <= 0) return null;
    const w = text.length * 19 + 48;
    return (
      <g key={key} opacity={p} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * p})`}>
        <rect x={-w / 2} y={-30} width={w} height={60} rx={30} fill={bg} />
        <text x={0} y={11} textAnchor="middle" fontFamily={theme.font} fontSize={32} fontWeight={800} fill={fg}>
          {text}
        </text>
      </g>
    );
  };
  stacks.forEach((s, k) => {
    const custF = at(`cust:${k}`);
    if (custF >= 99999) return;
    const cx = left + span * (k + 0.5);
    const c = coins[k];
    const own = s.own ?? 1;
    const midY = BASE - ((own + c) / 2) * T;
    const side = cx > 500 ? -1 : 1;
    if (props.custLabel) els.push(pill(`cust-${k}`, props.custLabel, Math.min(860, Math.max(150, cx + side * (W / 2 + 150))), midY, ramp(frame, custF + 10, custF + 20), BLUE, '#ffffff'));
    if (props.ownLabel) els.push(pill(`own-${k}`, props.ownLabel, Math.min(860, Math.max(150, cx + side * (W / 2 + 150))), BASE - own * T * 0.5 + 10, ramp(frame, custF + 18, custF + 28), GOLD, '#1a1206'));
  });

  return (
    <Stage push={push}>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <line x1={40} x2={960} y1={BASE + EH / 2 + 6} y2={BASE + EH / 2 + 6} stroke={pal.line} strokeWidth={3} />
        {props.title ? (
          <g>
            <rect x={500 - (props.title.length * 11 + 40) / 2} y={18} width={props.title.length * 11 + 40} height={50} rx={25} fill={rgba(pal.text, 0.08)} stroke={pal.line} />
            <text x={500} y={52} textAnchor="middle" fontFamily={theme.font} fontSize={24} fontWeight={800} letterSpacing={1.5} fill={pal.muted}>
              {props.title}
            </text>
          </g>
        ) : null}
        {hasWallet && walletShow > 0 ? (
          <g opacity={walletShow}>
            <rect x={wx - 95} y={BASE - 150} width={190} height={210} rx={24} fill="none" stroke={pal.good} strokeWidth={4} strokeDasharray="12 10" />
            <text x={wx} y={BASE + EH / 2 + 50} textAnchor="middle" fontFamily={theme.font} fontSize={32} fontWeight={800} fill={pal.good}>
              {props.wallet?.label ?? 'Your wallet'}
            </text>
          </g>
        ) : null}
        {els}
        {(props.labels ?? []).map((l, i) => {
          const f = at(`label:${i}`);
          return pill(`l-${i}`, l.text, 500, l.y ?? 110, ramp(frame, f, f + 8), toneOf(pal, l.tone ?? 'accent'), l.tone === 'alert' || l.tone === 'accent' ? '#ffffff' : '#06121a');
        })}
      </svg>
    </Stage>
  );
};

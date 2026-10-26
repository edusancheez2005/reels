import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, ramp, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A cutaway of a rechargeable (lithium-ion style) cell: layered electrode on the left (graphite),
 * lattice electrode on the right (metal oxide), liquid electrolyte, a porous separator wall in the middle,
 * ions that shuttle between the two, and an optional outer wire with a device (phone) or charger (plug).
 *
 * `actions[i]` fires on beat i. Actions:
 *   left | right | liquid | wall   reveal that part (parts not named in actions are visible from the start)
 *   wire | phone | plug            draw the outer wire with that device on it
 *   charge | discharge             ions travel right→left / left→right (electrons run the wire if it is shown)
 *   split                          the highlighted ion drops its electron (Li → Li⁺ + e⁻)
 *   block                          an electron tries the wall and bounces off (red ✕)
 *   home                           dashed arrow from left to right, labelled `homeLabel`
 *   cycle                          ions rock back and forth repeatedly; `counter` ticks up
 *   meter                          show the charge meter
 *   label:<n>                      show labels[n]
 * `cam[{beat, x, y, zoom}]` moves the camera (stage coords; a cam on beat -1 or 0 is the opening shot).
 */
type Label = {text: string; x: number; y: number; tone?: 'accent' | 'alert' | 'text' | 'good'};
type Cam = {beat: number; x: number; y: number; zoom: number};
type P = {
  ions?: 'left' | 'right';
  actions?: string[];
  labels?: Label[];
  cam?: Cam[];
  leftLabel?: string;
  rightLabel?: string;
  homeLabel?: string;
  counter?: {to: number; suffix?: string};
  highlight?: number;
  /** parts hidden until an action reveals them: left|right|liquid|wall|ions */
  hide?: string[];
  /** starting ion state 0 (oxide) … 1 (graphite); overrides `ions` */
  ionStart?: number;
  /** frames an ion takes to cross (default 34) */
  dur?: number;
};

const N = 10;
const L = {x0: 90, x1: 330};
const R = {x0: 670, x1: 910};
const TOP = 260;
const BOT = 760;
const WALL = 500;
const ROWS = 5;
const rowY = (r: number) => TOP + 60 + r * ((BOT - TOP - 120) / (ROWS - 1));
const leftSlot = (i: number): [number, number] => {
  const r = Math.floor(i / 2);
  const c = i % 2;
  return [L.x0 + 70 + c * 100, rowY(r) + 0];
};
const rightSlot = (i: number): [number, number] => {
  const r = Math.floor(i / 2);
  const c = i % 2;
  return [R.x0 + 70 + c * 100, rowY(r) + 0];
};
const WIRE_Y = 120;
// wire path: from top of left electrode, up, across, down to right electrode
const wirePts: [number, number][] = [
  [210, TOP],
  [210, WIRE_Y],
  [790, WIRE_Y],
  [790, TOP],
];
const segLen = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const WIRE_LEN = wirePts.slice(1).reduce((s, p, i) => s + segLen(wirePts[i], p), 0);
const along = (t: number): [number, number] => {
  let d = ((t % 1) + 1) % 1 * WIRE_LEN;
  for (let i = 1; i < wirePts.length; i++) {
    const l = segLen(wirePts[i - 1], wirePts[i]);
    if (d <= l) {
      const a = wirePts[i - 1];
      const b = wirePts[i];
      return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l];
    }
    d -= l;
  }
  return wirePts[wirePts.length - 1];
};

const ION = '#3D7BFF';
const ELECTRON = '#FFC531';

export const BatteryCell: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const acts = props.actions ?? [];
  const at = (name: string) => {
    const i = acts.findIndex((a) => a === name);
    return i < 0 ? null : revealFrame(beats, i) - LEAD_FRAMES;
  };
  const vis = (name: string) => {
    const f = at(name);
    if (f === null) return ['left', 'right', 'liquid', 'wall', 'ions'].includes(name) && !(props.hide ?? []).includes(name) ? 1 : 0;
    return ramp(frame, f, f + 12, Easing.out(Easing.cubic));
  };
  const has = (name: string) => acts.includes(name);

  // ---- ion state: 1 = in graphite (left), 0 = in oxide (right)
  const start0 = props.ionStart ?? ((props.ions ?? 'right') === 'left' ? 1 : 0);
  const moves = acts
    .map((a, i) => ({a, f: revealFrame(beats, i) - LEAD_FRAMES}))
    .filter((m) => m.a === 'charge' || m.a === 'discharge' || m.a === 'cycle');
  const STAG = 4;
  const DUR = props.dur ?? 34;
  const ionState = (i: number) => {
    let s = start0;
    for (const m of moves) {
      if (m.a === 'cycle') {
        const local = frame - m.f - i * 2;
        if (local < 0) continue;
        const per = 26;
        const ph = (local % (per * 2)) / per; // 0..2
        const base = s;
        const tri = ph < 1 ? Easing.inOut(Easing.cubic)(ph) : Easing.inOut(Easing.cubic)(2 - ph);
        s = base === 1 ? 1 - tri : tri;
        continue;
      }
      const to = m.a === 'charge' ? 1 : 0;
      const p = interpolate(frame, [m.f + i * STAG, m.f + i * STAG + DUR], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
      s = s + (to - s) * p;
    }
    return s;
  };
  const ionPos = (i: number): [number, number] => {
    const s = ionState(i);
    const [rx, ry] = rightSlot(i);
    const [lx, ly] = leftSlot(i);
    const x = rx + (lx - rx) * s;
    const wob = Math.sin(frame / 5 + i * 1.7) * 26 * Math.sin(Math.PI * s);
    const y = ry + (ly - ry) * s + wob + Math.sin(Math.PI * s) * ((i % 2 ? 1 : -1) * 40);
    return [x, y];
  };
  const fill = Array.from({length: N}, (_, i) => ionState(i)).reduce((a, b) => a + b, 0) / N;

  // ---- camera
  const cams = (props.cam ?? []).map((c) => ({...c, f: c.beat < 0 ? -999 : revealFrame(beats, c.beat) - LEAD_FRAMES}));
  let cx = 500;
  let cy = 450;
  let cz = 1;
  if (cams.length) {
    cx = cams[0].x;
    cy = cams[0].y;
    cz = cams[0].zoom;
    for (let k = 1; k < cams.length; k++) {
      const p = ramp(frame, cams[k].f, cams[k].f + 18);
      cx += (cams[k].x - cx) * p;
      cy += (cams[k].y - cy) * p;
      cz += (cams[k].zoom - cz) * p;
    }
  }
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.035]);
  const camT = `translate(500 450) scale(${cz * drift}) translate(${-cx} ${-cy})`;

  // ---- wire / device
  const wireF = at('wire') ?? at('phone') ?? at('plug');
  const wireP = wireF === null ? 0 : ramp(frame, wireF, wireF + 14);
  const device = has('plug') ? 'plug' : has('phone') ? 'phone' : null;
  const dischargeF = at('discharge');
  const chargeF = at('charge');
  const cycleF = at('cycle');
  // electrons along the wire: discharge → left→right, charge → right→left
  let eDir = 0;
  let eStart = 0;
  if (wireP > 0.95) {
    if (cycleF !== null && frame >= cycleF) {
      eDir = Math.sin(((frame - cycleF) / 26) * Math.PI) > 0 ? -1 : 1;
      eStart = cycleF;
    } else if (dischargeF !== null && frame >= dischargeF && (chargeF === null || dischargeF > chargeF || frame < chargeF)) {
      eDir = 1;
      eStart = dischargeF;
    } else if (chargeF !== null && frame >= chargeF) {
      eDir = -1;
      eStart = chargeF;
    } else if (has('phone') && !has('charge')) {
      eDir = 1;
      eStart = wireF ?? 0;
    }
  }
  const glow = eDir !== 0 ? ramp(frame, eStart, eStart + 10) : 0;

  // ---- split / block
  const hi = props.highlight ?? 0;
  const splitF = at('split');
  const sp = splitF === null ? 0 : ramp(frame, splitF, splitF + 16, Easing.out(Easing.cubic));
  const blockF = at('block');
  const homeF = at('home');
  const homeP = homeF === null ? 0 : ramp(frame, homeF, homeF + 16);
  const meterP = vis('meter');
  const cycF = at('cycle');
  const count = cycF === null || !props.counter ? 0 : Math.round(interpolate(frame, [cycF, durationInFrames - 6], [1, props.counter.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}));

  const graphite = pal.name === 'dark' ? '#4A4F5C' : '#3B3F48';
  const oxideM = pal.name === 'dark' ? '#9AA3B5' : '#7B8496';
  const oxideO = '#E5484D';

  const pill = (lb: Label, k: number, o: number) => {
    const w = lb.text.length * 25 + 64;
    const col = lb.tone === 'alert' ? pal.alert : lb.tone === 'good' ? pal.good : lb.tone === 'text' ? pal.text : pal.accent;
    return (
      <g key={k} opacity={o} transform={`translate(${lb.x} ${lb.y}) scale(${0.7 + 0.3 * o})`}>
        <rect x={-w / 2} y={-40} width={w} height={80} rx={40} fill={col} />
        <text x={0} y={16} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={46} fill={lb.tone === 'text' ? pal.bg : '#fff'}>
          {lb.text}
        </text>
      </g>
    );
  };

  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <radialGradient id="ionG">
            <stop offset="0%" stopColor="#9CC0FF" />
            <stop offset="100%" stopColor={ION} />
          </radialGradient>
          <clipPath id="cellClip">
            <rect x={60} y={TOP} width={880} height={BOT - TOP} rx={36} />
          </clipPath>
        </defs>
        <g transform={camT}>
          {/* casing */}
          <rect x={60} y={TOP} width={880} height={BOT - TOP} rx={36} fill={pal.panel} stroke={pal.line} strokeWidth={4} />
          {/* liquid */}
          <g clipPath="url(#cellClip)" opacity={vis('liquid')}>
            <rect x={L.x1} y={TOP} width={R.x0 - L.x1} height={BOT - TOP} fill={rgba(ION, pal.name === 'dark' ? 0.16 : 0.12)} />
            {Array.from({length: 14}, (_, k) => {
              const x = L.x1 + 20 + ((k * 53 + frame * (k % 2 ? 0.6 : -0.4)) % 300 + 300) % 300;
              const y = TOP + 40 + ((k * 97) % 420) + Math.sin(frame / 12 + k) * 10;
              return <circle key={k} cx={x} cy={y} r={4} fill={rgba(ION, 0.35)} />;
            })}
          </g>
          {/* graphite layers */}
          <g opacity={vis('left')}>
            {Array.from({length: ROWS + 1}, (_, r) => {
              const y = rowY(0) - 60 + r * ((BOT - TOP - 120) / (ROWS - 1));
              const yy = Math.min(Math.max(y, TOP + 14), BOT - 30);
              return (
                <g key={r}>
                  <rect x={L.x0} y={yy} width={L.x1 - L.x0} height={18} rx={9} fill={graphite} />
                  {Array.from({length: 8}, (_, k) => (
                    <circle key={k} cx={L.x0 + 15 + k * 30} cy={yy + 9} r={4} fill={pal.name === 'dark' ? '#7A8090' : '#6A6F7A'} />
                  ))}
                </g>
              );
            })}
          </g>
          {/* oxide lattice */}
          <g opacity={vis('right')}>
            {Array.from({length: 6}, (_, r) =>
              Array.from({length: 5}, (_, c) => {
                const x = R.x0 + 20 + c * 50;
                const y = TOP + 22 + r * ((BOT - TOP - 44) / 5);
                const odd = (r + c) % 2 === 0;
                return <circle key={`${r}-${c}`} cx={x} cy={y} r={odd ? 15 : 9} fill={odd ? oxideM : oxideO} opacity={0.9} />;
              }),
            )}
          </g>
          {/* separator wall */}
          <g opacity={vis('wall')}>
            <line x1={WALL} x2={WALL} y1={TOP + 8} y2={BOT - 8} stroke={pal.text} strokeWidth={10} strokeDasharray="34 14" strokeLinecap="round" opacity={0.75} />
          </g>
          {/* electrode labels */}
          {props.leftLabel ? (
            <text x={(L.x0 + L.x1) / 2} y={BOT + 62} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={40} fill={pal.text} opacity={vis('left')}>
              {props.leftLabel}
            </text>
          ) : null}
          {props.rightLabel ? (
            <text x={(R.x0 + R.x1) / 2} y={BOT + 62} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={40} fill={pal.text} opacity={vis('right')}>
              {props.rightLabel}
            </text>
          ) : null}
          {/* wire + device */}
          {wireP > 0 ? (
            <g>
              <polyline
                points={wirePts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={glow > 0 ? ELECTRON : pal.muted}
                strokeOpacity={0.5 + 0.5 * glow}
                strokeWidth={10}
                strokeLinejoin="round"
                strokeDasharray={WIRE_LEN}
                strokeDashoffset={WIRE_LEN * (1 - wireP)}
              />
              {eDir !== 0
                ? Array.from({length: 9}, (_, k) => {
                    const t = (k / 9 + ((frame - eStart) / 70) * eDir + 10) % 1;
                    const [x, y] = along(t);
                    if (Math.abs(x - 500) < 80 && Math.abs(y - WIRE_Y) < 10) return null;
                    return (
                      <g key={k} opacity={glow}>
                        <circle cx={x} cy={y} r={15} fill={ELECTRON} />
                        <text x={x} y={y + 7} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={22} fill="#3A2A00">–</text>
                      </g>
                    );
                  })
                : null}
              {device === 'phone' ? (
                <g transform={`translate(500 ${WIRE_Y}) scale(${wireP})`}>
                  <rect x={-55} y={-95} width={110} height={190} rx={20} fill={pal.name === 'dark' ? '#1B1F27' : '#22252C'} stroke={pal.line} strokeWidth={4} />
                  <rect x={-45} y={-80} width={90} height={160} rx={12} fill={glow > 0 ? rgba(ELECTRON, 0.25 + 0.6 * glow) : '#0B0D12'} />
                  {glow > 0 ? <path d="M6 -40 L-18 6 L0 6 L-6 40 L20 -8 L2 -8 Z" fill="#fff" opacity={glow} /> : null}
                </g>
              ) : device === 'plug' ? (
                <g transform={`translate(500 ${WIRE_Y}) scale(${wireP})`}>
                  <rect x={-80} y={-50} width={160} height={100} rx={22} fill={pal.text} />
                  <rect x={-40} y={-82} width={16} height={36} rx={5} fill={pal.text} />
                  <rect x={24} y={-82} width={16} height={36} rx={5} fill={pal.text} />
                  <path d="M8 -32 L-20 6 L0 6 L-8 34 L22 -6 L2 -6 Z" fill={ELECTRON} />
                </g>
              ) : null}
            </g>
          ) : null}
          {/* home arrow */}
          {homeP > 0 ? (
            <g opacity={homeP}>
              <path d={`M ${L.x1 - 40} ${TOP + 40} Q 500 ${TOP - 70} ${R.x0 + 40} ${TOP + 40}`} fill="none" stroke={pal.accent} strokeWidth={8} strokeDasharray="18 14" strokeDashoffset={-frame * 2} />
              <path d={`M ${R.x0 + 40} ${TOP + 40} l -34 -10 l 14 32 Z`} fill={pal.accent} />
              {props.homeLabel ? pill({text: props.homeLabel, x: 500, y: TOP - 70}, 99, homeP) : null}
            </g>
          ) : null}
          {/* ions */}
          <g opacity={vis('ions')}>
          {Array.from({length: N}, (_, i) => {
            const [x, y] = ionPos(i);
            const isHi = i === hi && splitF !== null;
            const r = 22;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={r + 10} fill={rgba(ION, 0.22)} />
                <circle cx={x} cy={y} r={r} fill="url(#ionG)" stroke={isHi ? '#fff' : 'none'} strokeWidth={4} />
                <text x={x} y={y + 8} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={22} fill="#fff">
                  {isHi && sp < 0.5 ? 'Li' : 'Li⁺'}
                </text>
                {isHi ? (() => {
                  // the electron leaves the atom and heads up toward the wire
                  const ex = x + 34 * (1 - sp) + sp * (210 - x);
                  const ey = y - 30 * (1 - sp) + sp * (TOP + 10 - y);
                  return (
                    <g>
                      <circle cx={ex} cy={ey} r={15} fill={ELECTRON} />
                      <text x={ex} y={ey + 7} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={22} fill="#3A2A00">–</text>
                    </g>
                  );
                })() : null}
              </g>
            );
          })}
          </g>
          {/* blocked electron */}
          {blockF !== null && frame >= blockF ? (() => {
            const t = frame - blockF;
            const go = interpolate(t, [0, 12, 20], [0, 1, 0.55], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
            const x = 380 + go * (WALL - 22 - 380);
            const y = 510;
            const xp = ramp(frame, blockF + 10, blockF + 18, Easing.out(Easing.back(2)));
            return (
              <g>
                <circle cx={x} cy={y} r={18} fill={ELECTRON} />
                <text x={x} y={y + 8} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={26} fill="#3A2A00">–</text>
                <g transform={`translate(${WALL} ${y}) scale(${xp})`}>
                  <circle r={46} fill={pal.alert} />
                  <path d="M -18 -18 L 18 18 M 18 -18 L -18 18" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
                </g>
              </g>
            );
          })() : null}
          {/* labels */}
          {(props.labels ?? []).map((lb, k) => {
            const f = at(`label:${k}`);
            if (f === null) return null;
            const o = ramp(frame, f, f + 9, Easing.out(Easing.back(1.6)));
            return pill(lb, k, o);
          })}
        </g>
        {/* charge meter (screen-fixed) */}
        {meterP > 0 ? (
          <g opacity={meterP} transform="translate(500 850)">
            <rect x={-150} y={-36} width={300} height={72} rx={16} fill="none" stroke={pal.text} strokeWidth={6} />
            <rect x={150} y={-14} width={14} height={28} rx={4} fill={pal.text} />
            <rect x={-142} y={-28} width={284 * fill} height={56} rx={10} fill={fill > 0.95 ? pal.good : pal.accent} />
            <text x={0} y={14} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={40} fill={pal.text} style={{mixBlendMode: 'normal'}}>
              {Math.round(fill * 100)}%
            </text>
          </g>
        ) : null}
        {props.counter && cycF !== null && frame >= cycF ? (
          <g transform="translate(500 850)">
            <text x={0} y={16} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={56} fill={pal.text}>
              {`Charge ${count}${props.counter.suffix ?? ''}`}
            </text>
          </g>
        ) : null}
      </svg>
    </Stage>
  );
};

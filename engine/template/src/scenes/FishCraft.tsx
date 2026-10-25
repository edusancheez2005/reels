import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, rnd, type SceneProps} from '../lib/anim';
import {usePal} from '../lib/palette';
import {theme} from '../lib/theme';
import {COD, CodDetailed, FleshSide, Frame, FilletKnife, Fins, Glove, Head, SkinSide, Tail, bodyPoint} from '../lib/fishArt';

const at = (beats: number[], i: number) => revealFrame(beats, i) - LEAD_FRAMES;
const seg = (f: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, Math.max(a + 1, b)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPts = (a: number[][], b: number[][], t: number) => a.map((p, i) => `${L(p[0], b[i][0], t)},${L(p[1], b[i][1], t)}`).join(' ');

/* ------------------------------------------------------------------------------------------ */
/* Freeze → carton → refrigerated container                                                    */
/* beats: 0 fish lands on the freezer tray, 1 it freezes (frost grows, readout drops, mist),    */
/*        2 packed into a carton (flaps, tape, stamp), 3 cartons load into a refrigerated       */
/*        container whose doors swing shut and lock.                                            */
/* ------------------------------------------------------------------------------------------ */

const Carton: React.FC<{open?: number; tape?: number; stamp?: number; children?: React.ReactNode; label?: string}> = ({open = 0, tape = 1, stamp = 0, children, label}) => {
  // open: 1 = flaps up, 0 = closed
  const t = 1 - open;
  return (
    <g>
      <polygon points="660,560 700,520 700,760 660,800" fill="#A9773F" />
      <polygon points="340,560 660,560 700,520 380,520" fill={open > 0.05 ? '#5B3D1C' : '#D5A468'} />
      <polygon points={lerpPts([[380, 520], [700, 520], [700, 430], [380, 430]], [[380, 520], [700, 520], [680, 540], [360, 540]], t)} fill="#C08D52" stroke="#A9773F" strokeWidth={2} />
      {children}
      <rect x={340} y={560} width={320} height={240} fill="#C9955A" />
      <rect x={340} y={560} width={320} height={240} fill="url(#cartonShade)" />
      <polygon points={lerpPts([[340, 560], [660, 560], [660, 470], [340, 470]], [[340, 560], [660, 560], [680, 540], [360, 540]], t)} fill="#D9AA6E" stroke="#B4823F" strokeWidth={2} />
      {tape > 0 && open < 0.05 ? <polygon points={`360,533 ${360 + 320 * tape},533 ${360 + 320 * tape},547 360,547`} fill="#E9DDB5" opacity={0.95} /> : null}
      {tape > 0 && open < 0.05 ? <rect x={492} y={560} width={16} height={60 * tape} fill="#E9DDB5" opacity={0.95} /> : null}
      <text x={500} y={640} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={28} fill="#7A5226" opacity={0.75}>
        {label ?? 'ATLANTIC COD · 10 KG'}
      </text>
      {stamp > 0 ? (
        <g transform={`translate(500 712) rotate(-7) scale(${L(1.8, 1, stamp)})`} opacity={Math.min(1, stamp * 1.4)}>
          <rect x={-128} y={-34} width={256} height={68} rx={8} fill="none" stroke="#DC2626" strokeWidth={6} />
          <text x={0} y={13} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={34} letterSpacing={2} fill="#DC2626">
            FROZEN −18°C
          </text>
        </g>
      ) : null}
    </g>
  );
};

export const ColdChain: React.FC<SceneProps<{label?: string; temp?: number}>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pal = usePal();
  const b0 = at(beats, 0);
  const b1 = at(beats, 1);
  const b2 = at(beats, 2);
  const b3 = at(beats, 3);
  const land = spring({frame: frame - b0, fps, durationInFrames: 12, config: {damping: 13}});
  const frost = seg(frame, b1, b1 + 20, Easing.out(Easing.quad));
  const temp = L(4, props.temp ?? -18, seg(frame, b1, b1 + 20, Easing.out(Easing.quad)));
  const shiver = frame > b1 && frame < b1 + 18 ? Math.sin(frame * 2.3) * 1.6 * (1 - frost) : 0;
  const cartonIn = spring({frame: frame - (b2 - 4), fps, durationInFrames: 12, config: {damping: 14}});
  const pack = seg(frame, b2, b2 + 11);
  const flaps = seg(frame, b2 + 9, b2 + 17);
  const tape = seg(frame, b2 + 15, b2 + 21);
  const stamp = seg(frame, b2 + 18, b2 + 24, Easing.out(Easing.back(2)));
  const extra = seg(frame, b2 + 10, b2 + 20, Easing.out(Easing.cubic));
  const ctrIn = seg(frame, b3 - 4, b3 + 8, Easing.out(Easing.cubic));
  const load = seg(frame, b3, b3 + 14, Easing.inOut(Easing.cubic));
  const doors = seg(frame, b3 + 12, b3 + 21, Easing.inOut(Easing.cubic));
  const lock = seg(frame, b3 + 20, b3 + 25);
  const labelP = seg(frame, b3 + 14, b3 + 20, Easing.out(Easing.back(1.6)));

  // fish transform: on the tray → into the carton
  const fx = L(110, 390, pack);
  const fy = L(250 - (1 - land) * 260, 500, pack);
  const fs = L(1.95, 0.6, pack);
  const fishVisible = flaps < 0.7;

  // carton group transform: centre (500,660) → into the container (725,460), small
  const gx = L(0, 725 - 500 * 0.3, load);
  const gy = L((1 - cartonIn) * 500, 460 - 660 * 0.3, load);
  const gs = L(1, 0.3, load);

  // container geometry (door end facing us)
  const cx = (1 - ctrIn) * 900;
  const D = {x0: 560, x1: 900, y0: 230, y1: 590};
  const mid = (D.x0 + D.x1) / 2;
  const doorK = L(-0.32, 1, doors);
  const doorShade = Math.abs(doorK) < 0.35 ? 0.75 : 1;

  const temps = `${temp >= 0 ? '+' : '−'}${Math.abs(temp).toFixed(1)}°C`;
  const showTray = 1 - seg(frame, b2, b2 + 8);

  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id="cartonShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.12)" />
          </linearGradient>
          <linearGradient id="trayG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E2E8F0" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="interior" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1E3A5F" />
            <stop offset="1" stopColor="#0B1220" />
          </linearGradient>
          <filter id="mist">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* ---------- container (enters at beat 3) ---------- */}
        {ctrIn > 0 ? (
          <g transform={`translate(${cx} 0)`}>
            <ellipse cx={520} cy={640} rx={420} ry={34} fill="rgba(0,0,0,0.12)" />
            <polygon points={`150,180 ${D.x0},${D.y0} ${D.x1},${D.y0} 490,180`} fill="#C9D2DC" stroke="#94A3B8" strokeWidth={2} />
            <polygon points={`150,180 ${D.x0},${D.y0} ${D.x0},${D.y1} 150,510`} fill="#DDE3EA" stroke="#94A3B8" strokeWidth={2} />
            {Array.from({length: 16}).map((_, i) => {
              const u = (i + 0.5) / 16;
              const xa = L(150, D.x0, u);
              return <line key={i} x1={xa} y1={L(180, D.y0, u) + 6} x2={xa} y2={L(510, D.y1, u) - 6} stroke="#B8C3CF" strokeWidth={L(2, 4, u)} />;
            })}
            <text x={300} y={380} fontFamily={theme.font} fontWeight={900} fontSize={30} fill="#3B82F6" opacity={0.85} transform="skewY(7)">
              ❄ REFRIGERATED
            </text>
            {/* door frame + interior */}
            <rect x={D.x0} y={D.y0} width={D.x1 - D.x0} height={D.y1 - D.y0} fill="url(#interior)" stroke="#94A3B8" strokeWidth={3} />
            <rect x={640} y={330} width={180} height={170} fill="#0E1A2E" stroke="#23406A" strokeWidth={2} />
            {[[D.x0, D.y0, 640, 330], [D.x1, D.y0, 820, 330], [D.x0, D.y1, 640, 500], [D.x1, D.y1, 820, 500]].map(([a, b, c, d], i) => (
              <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#23406A" strokeWidth={2} />
            ))}
            <rect x={600} y={262} width={260} height={10} rx={5} fill="#7DD3FC" opacity={0.55} />
          </g>
        ) : null}

        {/* ---------- freezer tray + fish (beats 0–1) ---------- */}
        <g opacity={showTray}>
          <rect x={70} y={498} width={860} height={34} rx={10} fill="url(#trayG)" />
          <rect x={70} y={530} width={860} height={10} rx={5} fill="#64748B" />
        </g>
        {Array.from({length: 10}).map((_, i) => {
          if (frost <= 0 || pack > 0.5) return null;
          const age = (frame - b1 - i * 2.5) * 2.2;
          if (age < 0) return null;
          const y = 470 - (age % 220);
          return <circle key={i} cx={160 + i * 72 + Math.sin((frame + i * 9) / 9) * 14} cy={y} r={26 + (i % 3) * 10} fill="#FFFFFF" opacity={0.32 * frost * (1 - (age % 220) / 220)} filter="url(#mist)" />;
        })}

        {/* ---------- cartons (beats 2–3) ---------- */}
        <g transform={`translate(${gx} ${gy}) scale(${gs})`} opacity={cartonIn > 0.01 ? 1 : 0}>
          <g transform={`translate(${L(-700, -300, extra)} 40) scale(0.92)`} opacity={extra}>
            <Carton open={0} tape={1} stamp={1} />
          </g>
          <g transform={`translate(${L(1100, 300, extra)} 40) scale(0.92)`} opacity={extra}>
            <Carton open={0} tape={1} stamp={1} />
          </g>
          <Carton open={1 - flaps} tape={tape} stamp={stamp}>
            {fishVisible && pack > 0.88 ? (
              <g transform={`translate(${fx} ${fy}) scale(${fs})`}>
                <CodDetailed id="cc-in" frost={1} />
              </g>
            ) : null}
          </Carton>
        </g>
        {fishVisible && pack <= 0.88 ? (
          <g transform={`translate(${fx + shiver} ${fy}) rotate(${Math.sin(pack * Math.PI) * -7} 200 84) scale(${fs})`} opacity={land}>
            <CodDetailed id="cc" frost={frost} wet={1 - frost} />
          </g>
        ) : null}

        {/* ---------- container doors close over the cartons ---------- */}
        {ctrIn > 0 ? (
          <g transform={`translate(${cx} 0)`}>
            {[
              {hinge: D.x0, from: D.x0, to: mid},
              {hinge: D.x1, from: mid, to: D.x1},
            ].map((d, k) => (
              <g key={k} transform={`translate(${d.hinge} 0) scale(${doorK} 1) translate(${-d.hinge} 0)`}>
                <rect x={d.from} y={D.y0} width={d.to - d.from} height={D.y1 - D.y0} fill="#F1F4F8" stroke="#94A3B8" strokeWidth={3} opacity={doorShade} />
                {Array.from({length: 7}).map((_, i) => (
                  <line key={i} x1={d.from + 12 + i * 23} y1={D.y0 + 10} x2={d.from + 12 + i * 23} y2={D.y1 - 10} stroke="#CBD5E1" strokeWidth={3} />
                ))}
                {[0.3, 0.72].map((u) => {
                  const bx = L(d.from, d.to, u);
                  return (
                    <g key={u}>
                      <rect x={bx - 4} y={D.y0 + 6} width={8} height={D.y1 - D.y0 - 12} rx={4} fill="#94A3B8" />
                      <g transform={`rotate(${L(75, 0, lock)} ${bx} 430)`}>
                        <rect x={bx - 4} y={420} width={40} height={14} rx={6} fill="#475569" />
                      </g>
                    </g>
                  );
                })}
              </g>
            ))}
            {doors > 0.95
              ? Array.from({length: 6}).map((_, i) => {
                  const age = frame - (b3 + 21) - i * 2;
                  if (age < 0) return null;
                  return <circle key={i} cx={mid + age * 3 + (i % 2) * 20} cy={280 + i * 52 - age * 1.5} r={18 + age} fill="#FFFFFF" opacity={Math.max(0, 0.45 - age * 0.03)} filter="url(#mist)" />;
                })
              : null}
          </g>
        ) : null}

        {/* ---------- digital readout (whole scene) ---------- */}
        <g transform="translate(690 20)" opacity={land}>
          {ctrIn > 0.6 ? <line x1={150} y1={110} x2={210 + cx} y2={210} stroke={pal.muted} strokeWidth={3} strokeDasharray="6 8" opacity={ctrIn} /> : null}
          <rect x={0} y={0} width={290} height={112} rx={20} fill="#0F172A" stroke="#1E293B" strokeWidth={3} />
          <text x={24} y={44} fontFamily={theme.font} fontWeight={800} fontSize={20} letterSpacing={3} fill="#64748B">
            {ctrIn > 0.6 ? 'CONTAINER TEMP' : 'BLAST FREEZER'}
          </text>
          <text x={24} y={94} fontFamily={theme.mono} fontWeight={700} fontSize={50} fill={temp < 0 ? '#67E8F9' : '#FBBF24'}>
            {temps}
          </text>
          <text x={250} y={94} textAnchor="middle" fontSize={34} opacity={frost}>❄</text>
        </g>
      </svg>
      {props.label ? (
        <div style={{position: 'absolute', left: 500, top: 820, transform: `translate(-50%, -50%) scale(${L(0.6, 1, labelP)})`, opacity: labelP, padding: '16px 34px', borderRadius: 999, background: '#0F172A', color: '#fff', fontFamily: theme.font, fontWeight: 800, fontSize: 40, whiteSpace: 'nowrap', boxShadow: pal.shadow}}>
          ❄ {props.label}
        </div>
      ) : null}
      <div style={{display: 'none'}}>{durationInFrames}</div>
    </Stage>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Filleting by hand, close-up on the board.                                                   */
/* beats: 0 board + frozen fish, 1 thaw (ice melts, droplets, puddle), 2 knife cuts behind the  */
/*        head then saws along the spine, 3 the fillet peels off, flips to the flesh side and   */
/*        lands on a tray, leaving the skeleton.                                                */
/* ------------------------------------------------------------------------------------------ */
export const Filleting: React.FC<SceneProps<{tray?: boolean}>> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b0 = at(beats, 0);
  const b1 = at(beats, 1);
  const b2 = at(beats, 2);
  const b3 = at(beats, 3);
  const S = 2.0;
  const FX0 = 100;
  const FY0 = 300;
  const toStage = (x: number, y: number) => [FX0 + S * x, FY0 + S * y];

  const enter = spring({frame: frame - b0, fps, durationInFrames: 14, config: {damping: 14}});
  const thaw = seg(frame, b1, b1 + 18, Easing.out(Easing.quad));
  const gill = seg(frame, b2, b2 + 6);
  const along = seg(frame, b2 + 6, b3 + 1, Easing.inOut(Easing.sin));
  const lift = seg(frame, b3, b3 + 8, Easing.out(Easing.cubic));
  const flip = seg(frame, b3 + 5, b3 + 14);
  const toTray = seg(frame, b3 + 12, b3 + 22, Easing.inOut(Easing.cubic));
  const trayIn = seg(frame, b3 - 2, b3 + 8, Easing.out(Easing.back(1.4)));

  // knife contact point (fish coords) and angle
  let kx = 336;
  let ky = 6;
  let ang = -55;
  if (frame >= b2 && frame < b2 + 6) {
    kx = L(COD.gillCut[0][0], COD.gillCut[1][0], gill);
    ky = L(COD.gillCut[0][1], COD.gillCut[1][1], gill);
    ang = -80;
  } else if (frame >= b2 + 6 && frame < b3 + 2) {
    kx = L(COD.spine[0][0], COD.spine[1][0], along) + Math.sin(frame * 1.7) * 6;
    ky = L(COD.spine[0][1], COD.spine[1][1], along) + Math.cos(frame * 1.7) * 2;
    ang = L(-80, -10, seg(frame, b2 + 6, b2 + 11));
  } else if (frame >= b3 + 2) {
    const away = seg(frame, b3 + 2, b3 + 12);
    kx = L(46, 360, away);
    ky = L(86, -40, away);
    ang = L(-10, -35, away);
  }
  const [KX, KY] = toStage(kx, ky);

  // fillet transform (pivot = fillet centre)
  const P0 = toStage(180, 84);
  const FX = L(L(P0[0], 470, lift), 780, toTray);
  const FY = L(L(P0[1], 300, lift), 130, toTray);
  const rot = L(L(0, -8, lift), 0, toTray);
  const sy = L(1, -1, flip);
  const sc = L(1, 0.42, toTray);
  const filletT = `translate(${FX} ${FY}) rotate(${rot}) scale(${S * sc} ${S * sc * sy}) translate(-180 -84)`;
  const fleshUp = sy < 0;

  // left hand: presses the back, then carries the fillet corner
  const pressSquish = frame >= b2 && frame < b3 ? 1 + Math.sin(frame * 1.7) * 0.03 : 1;
  const grab = (() => {
    const lx = 110 - 180;
    const ly = 46 - 84;
    const r = (rot * Math.PI) / 180;
    const x = lx * S * sc;
    const y = ly * S * sc * sy;
    return [FX + x * Math.cos(r) - y * Math.sin(r), FY + x * Math.sin(r) + y * Math.cos(r)];
  })();
  const pressPos = toStage(150, 52);
  const handFollow = seg(frame, b3 - 2, b3 + 2);
  const handOff = seg(frame, b3 + 14, b3 + 22);
  const HX = L(L(pressPos[0], grab[0], handFollow), -200, handOff);
  const HY = L(L(pressPos[1], grab[1], handFollow), 200, handOff);

  const cutGill = frame >= b2 ? gill : 0;
  const cutAlong = frame >= b2 + 6 ? along : 0;

  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FAFBFC" />
            <stop offset="1" stopColor="#EEF1F4" />
          </linearGradient>
          <filter id="cutglow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <g transform={`translate(0 ${(1 - enter) * 500})`}>
          {/* board */}
          <rect x={30} y={300} width={940} height={440} rx={36} fill="#D5DAE1" />
          <rect x={30} y={286} width={940} height={440} rx={36} fill="url(#board)" stroke="#D5DAE1" strokeWidth={3} />
          {Array.from({length: 14}).map((_, i) => (
            <line key={i} x1={80 + rnd(i * 3.3) * 820} y1={320 + rnd(i * 7.1) * 380} x2={80 + rnd(i * 3.3) * 820 + 40 + rnd(i) * 60} y2={320 + rnd(i * 7.1) * 380 + 8} stroke="#E2E6EB" strokeWidth={2} />
          ))}
          {/* melt puddle */}
          <ellipse cx={500} cy={580} rx={400 * thaw} ry={34 * thaw} fill="rgba(147,197,253,0.35)" />

          {/* the fish: frame (skeleton) underneath, tail, bottom fins, head on top */}
          <g transform={`translate(${FX0} ${FY0}) scale(${S})`}>
            <Tail />
            <path d="M206 126 C214 152 238 154 252 126 Z" fill="#8A7A4C" />
            <path d="M268 122 C278 146 300 148 312 118 Z" fill="#8A7A4C" />
            {lift > 0 ? <Frame id="fr" /> : null}
            <Head />
          </g>

        </g>

        {/* tray for the fillet */}
        <g transform={`translate(${L(1200, 0, trayIn)} 0)`}>
          <rect x={600} y={40} width={360} height={190} rx={22} fill="#CBD5E1" />
          <rect x={612} y={50} width={336} height={170} rx={16} fill="#E2E8F0" />
        </g>

        {/* fillet layer (skin side, then flips to flesh) */}
        <g transform={`translate(0 ${(1 - enter) * 500})`}>
          <g transform={filletT}>
            {!fleshUp ? (
              <>
                <Fins />
                <SkinSide id="fl" frost={1 - thaw} wet={thaw} />
                {/* cut lines */}
                {cutGill > 0 ? (
                  <line x1={COD.gillCut[0][0]} y1={COD.gillCut[0][1]} x2={L(COD.gillCut[0][0], COD.gillCut[1][0], cutGill)} y2={L(COD.gillCut[0][1], COD.gillCut[1][1], cutGill)} stroke="#F7DCCD" strokeWidth={3.5} filter="url(#cutglow)" />
                ) : null}
                {cutAlong > 0 ? (
                  <>
                    <line x1={COD.spine[0][0]} y1={COD.spine[0][1]} x2={L(COD.spine[0][0], COD.spine[1][0], cutAlong)} y2={L(COD.spine[0][1], COD.spine[1][1], cutAlong)} stroke="#F2C9B8" strokeWidth={5} filter="url(#cutglow)" />
                    <line x1={COD.spine[0][0]} y1={COD.spine[0][1]} x2={L(COD.spine[0][0], COD.spine[1][0], cutAlong)} y2={L(COD.spine[0][1], COD.spine[1][1], cutAlong)} stroke="#FFF4EE" strokeWidth={2} />
                  </>
                ) : null}
              </>
            ) : (
              <FleshSide id="fl2" />
            )}
          </g>
        </g>

        <g transform={`translate(0 ${(1 - enter) * 500})`}>
          {/* thaw droplets */}
          {thaw > 0 && thaw < 1
            ? Array.from({length: 16}).map((_, i) => {
                const u = (frame - (b1 + i * 1.1)) / 20;
                if (u <= 0 || u >= 1) return null;
                const [x, y] = bodyPoint(i + 40);
                const [sx, sy2] = toStage(x, y + u * u * 60);
                return <ellipse key={i} cx={sx} cy={sy2} rx={4.5} ry={6} fill="#93C5FD" stroke="#fff" strokeWidth={1.5} opacity={1 - u} />;
              })
            : null}
        </g>

        {/* scale flecks from the blade */}
        {Array.from({length: 12}).map((_, i) => {
          const te = b2 + 6 + i * 1.3;
          const age = frame - te;
          if (age < 0 || age > 12 || frame > b3 + 2) return null;
          const t = seg(te, b2 + 6, b3 + 1, Easing.inOut(Easing.sin));
          const [sx, sy2] = toStage(L(COD.spine[0][0], COD.spine[1][0], t), 84);
          return <circle key={i} cx={sx + (rnd(i) - 0.5) * 40 + age * (rnd(i * 2) - 0.5) * 6} cy={sy2 - age * 5 + age * age * 0.25} r={3} fill="#E8E0C8" opacity={1 - age / 12} />;
        })}

        {/* left hand */}
        <g transform={`translate(${HX} ${HY + (1 - enter) * 500}) scale(${1.25 * pressSquish}) rotate(${handFollow > 0 ? -20 : 10})`} opacity={enter}>
          <Glove pose="press" />
        </g>
        {/* knife + right hand */}
        <g transform={`translate(${KX} ${KY + (1 - enter) * 500}) rotate(${ang}) scale(1.3)`} opacity={enter}>
          <FilletKnife />
          <g transform="translate(252 -1) rotate(90)">
            <Glove pose="grip" />
          </g>
        </g>
      </svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Pin bones pulled with tweezers from the flesh side of a fillet.                             */
/* ------------------------------------------------------------------------------------------ */
export const PinBones: React.FC<SceneProps<{count?: number; label?: string}>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const n = props.count ?? 8;
  const a = at(beats, 0);
  const b = Math.max(a + 30, at(beats, beats.length - 1) + 12);
  const per = (b - a) / n;
  const done = Math.max(0, Math.min(n, Math.floor((frame - a) / per)));
  const cur = Math.min(n - 1, done);
  const phase = ((frame - a) % per) / per;
  const S = 2.25;
  const OX = 40;
  const OY = 160;
  const bone = (i: number) => {
    const x = 120 + i * 24;
    return {x1: OX + S * x, y1: OY + S * 82, x2: OX + S * (x + 6), y2: OY + S * 50};
  };
  const bc = bone(cur);
  const tx = frame < a ? bc.x2 + 60 : bc.x2;
  const lift = frame < a ? -140 : phase < 0.35 ? -120 + phase * 340 : phase < 0.55 ? -1 : -1 - (phase - 0.55) * 360;
  const enter = seg(frame, 0, 10, Easing.out(Easing.cubic));
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <rect x={30} y={190} width={940} height={500} rx={36} fill="#F7F8FA" stroke="#D5DAE1" strokeWidth={3} opacity={enter} />
        <g transform={`translate(${OX} ${OY + (1 - enter) * 80}) scale(${S})`}>
          <FleshSide id="pb" />
        </g>
        {Array.from({length: n}).map((_, i) => {
          const pulled = frame >= a && (i < done || (i === cur && phase > 0.55));
          if (pulled) return null;
          const bb = bone(i);
          return (
            <g key={i}>
              <line x1={bb.x1} y1={bb.y1} x2={bb.x2} y2={bb.y2} stroke="#FFFFFF" strokeWidth={6.5} strokeLinecap="round" />
              <circle cx={bb.x2} cy={bb.y2} r={5} fill="#FFFFFF" stroke="#E8D3C4" strokeWidth={2} />
            </g>
          );
        })}
        <rect x={700} y={720} width={230} height={120} rx={20} fill="#E2E8F0" stroke="#CBD5E1" strokeWidth={4} />
        {Array.from({length: done}).map((_, i) => (
          <line key={i} x1={728 + (i % 5) * 38} y1={812 - Math.floor(i / 5) * 40} x2={746 + (i % 5) * 38} y2={760 - Math.floor(i / 5) * 40} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
        ))}
        <g transform={`translate(${tx} ${bc.y2 + lift}) rotate(-24)`}>
          <path d="M-2 0 L-16 -250 L-4 -252 L5 -4 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth={1.5} />
          <path d="M6 0 L24 -248 L12 -252 L2 -4 Z" fill="#94A3B8" stroke="#64748B" strokeWidth={1.5} />
          {frame >= a && phase > 0.35 && phase < 1 ? <line x1={2} y1={0} x2={10} y2={64} stroke="#fff" strokeWidth={6.5} strokeLinecap="round" /> : null}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 726, textAlign: 'left', paddingLeft: 70, fontFamily: theme.font, fontWeight: 800, fontSize: 50, color: pal.text}}>
        {props.label ?? 'pin bones out'} <span style={{fontFamily: theme.mono, color: pal.accent}}>{done}/{n}</span>
      </div>
    </Stage>
  );
};

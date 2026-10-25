import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, Reveal, useReveal, rnd, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';
import {Cod, FishChips, Trawler} from '../lib/illustrations';

const at = (beats: number[], i: number) => revealFrame(beats, i) - LEAD_FRAMES;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Pill: React.FC<{text: string; p: number; x: number; y: number; tone?: string}> = ({text, p, x, y, tone}) => {
  const pal = usePal();
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.6, 1])})`, opacity: p, padding: '14px 28px', borderRadius: 999, background: tone ?? pal.text, color: pal.bg, fontFamily: theme.font, fontWeight: 800, fontSize: 36, whiteSpace: 'nowrap', boxShadow: pal.shadow}}>
      {text}
    </div>
  );
};

/** Trawler on a moving sea; beat 0 hauls the net up with a cod; beat 1 drops a location pill. */
export const SeaScene: React.FC<SceneProps<{place?: string}>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const haul = interpolate(frame, [at(beats, 0) - 6, at(beats, 0) + 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const pinP = interpolate(frame, [at(beats, 1), at(beats, 1) + 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const bob = Math.sin(frame / 11) * 7;
  const roll = Math.sin(frame / 15) * 2.4;
  const wave = (y: number, amp: number, k: number, speed: number, color: string) => {
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 1000; x += 20) d += ` L ${x} ${y + Math.sin(x / k + frame / speed) * amp}`;
    d += ' L 1000 900 L 0 900 Z';
    return <path d={d} fill={color} />;
  };
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, borderRadius: 40, overflow: 'hidden', background: 'linear-gradient(#BFD9EE, #EAF3FA 55%)', boxShadow: pal.shadow}}>
        <svg width={1000} height={900} style={{position: 'absolute', inset: 0}}>
          <circle cx={820} cy={150} r={60} fill="#FFF7D6" opacity={0.9} />
          {wave(520, 10, 60, 14, '#5B8DB8')}
          <g transform={`translate(330 ${300 + bob}) rotate(${roll} 190 200)`}>
            <Trawler />
            {/* net line from the gantry */}
            <line x1={70} y1={70} x2={-10 + (1 - haul) * 30} y2={260 - haul * 120} stroke="#374151" strokeWidth={3} />
          </g>
          {/* net with the catch */}
          <g transform={`translate(${190 + (1 - haul) * 20} ${560 - haul * 150 + bob})`}>
            <path d="M0 0 C-60 40 -40 140 60 150 C160 140 180 40 120 0 Z" fill="rgba(31,41,55,0.12)" stroke="#374151" strokeWidth={3} strokeDasharray="8 7" />
            <g transform="translate(-30 40) scale(0.55)">
              <Cod id="haul" />
            </g>
          </g>
          {wave(560, 14, 80, 10, '#3E6E99')}
          {wave(620, 16, 50, 8, '#2D5A84')}
          {Array.from({length: 6}).map((_, i) => (
            <path key={i} d={`M ${(i * 170 + frame * 2) % 1100 - 50} ${650 + (i % 3) * 70} q 20 -12 40 0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.5} />
          ))}
        </svg>
        <Pill text={props.place ?? 'North Atlantic, off Scotland'} p={pinP} x={500} y={800} />
      </div>
    </Stage>
  );
};

/** A balance: left pan on beat 0, right pan on beat 1, tips on beat 2 (the heavier, costlier side drops). */
export const Scale: React.FC<SceneProps<{left: {title: string; sub?: string; coins: number}; right: {title: string; sub?: string; coins: number}; verdict?: string}>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const lp = interpolate(frame, [at(beats, 0), at(beats, 0) + 10], [0, 1], clamp);
  const rp = interpolate(frame, [at(beats, 1), at(beats, 1) + 10], [0, 1], clamp);
  const tip = interpolate(frame, [at(beats, 2), at(beats, 2) + 18], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const heavierRight = props.right.coins >= props.left.coins;
  const ang = (heavierRight ? 1 : -1) * 14 * tip + Math.sin(frame / 12) * 0.6;
  const PIV = {x: 500, y: 250};
  const arm = 300;
  const rad = (ang * Math.PI) / 180;
  const L = {x: PIV.x - Math.cos(rad) * arm, y: PIV.y - Math.sin(rad) * arm};
  const R = {x: PIV.x + Math.cos(rad) * arm, y: PIV.y + Math.sin(rad) * arm};
  const pan = (c: {x: number; y: number}, side: {title: string; sub?: string; coins: number}, p: number, key: string) => (
    <g key={key} opacity={p}>
      <line x1={c.x} y1={c.y} x2={c.x - 110} y2={c.y + 170} stroke={pal.muted} strokeWidth={4} />
      <line x1={c.x} y1={c.y} x2={c.x + 110} y2={c.y + 170} stroke={pal.muted} strokeWidth={4} />
      <path d={`M ${c.x - 140} ${c.y + 170} Q ${c.x} ${c.y + 240} ${c.x + 140} ${c.y + 170} Z`} fill={pal.panel} stroke={pal.line} strokeWidth={4} />
      {Array.from({length: side.coins}).map((_, i) => {
        const appear = interpolate(frame, [at(beats, key === 'l' ? 0 : 1) + i * 2, at(beats, key === 'l' ? 0 : 1) + i * 2 + 6], [0, 1], clamp);
        return (
          <g key={i} opacity={appear} transform={`translate(${c.x - 60 + (i % 4) * 40} ${c.y + 160 - Math.floor(i / 4) * 22 - (1 - appear) * 40})`}>
            <ellipse cx={0} cy={0} rx={24} ry={10} fill="#F2B705" stroke="#B88A00" strokeWidth={3} />
            <text x={0} y={6} textAnchor="middle" fontSize={14} fontWeight={900} fill="#7A5B00" fontFamily={theme.font}>£</text>
          </g>
        );
      })}
      <text x={Math.min(760, Math.max(240, c.x))} y={c.y + 300} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={38} fill={pal.text}>{side.title}</text>
      {side.sub ? <text x={Math.min(760, Math.max(240, c.x))} y={c.y + 344} textAnchor="middle" fontFamily={theme.font} fontWeight={600} fontSize={28} fill={pal.muted}>{side.sub}</text> : null}
    </g>
  );
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`M ${PIV.x - 60} 760 L ${PIV.x + 60} 760 L ${PIV.x + 14} ${PIV.y} L ${PIV.x - 14} ${PIV.y} Z`} fill={pal.line} />
        <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke={pal.text} strokeWidth={12} strokeLinecap="round" />
        <circle cx={PIV.x} cy={PIV.y} r={16} fill={pal.text} />
        {pan(L, props.left, lp, 'l')}
        {pan(R, props.right, rp, 'r')}
      </svg>
      {props.verdict ? <Pill text={props.verdict} p={tip} x={heavierRight ? 220 : 780} y={110} tone="#16A34A" /> : null}
    </Stage>
  );
};

/** A sourced, paraphrased claim card (never a fake screenshot). Beat 0 card, beat 1 highlight on `mark`. */
export const Quote: React.FC<SceneProps<{source: string; text: string; mark?: string; stamp?: string}>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const {p} = useReveal(beats, 0, 12);
  const hl = interpolate(frame, [at(beats, 1), at(beats, 1) + 12], [0, 1], clamp);
  const parts = props.mark && props.text.includes(props.mark) ? props.text.split(props.mark) : [props.text];
  return (
    <Stage>
      <div style={{position: 'absolute', left: 60, right: 60, top: 170, padding: '56px 56px 60px', borderRadius: 36, background: pal.panel, boxShadow: pal.shadow, border: `1.5px solid ${pal.line}`, fontFamily: theme.font, opacity: p, transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * -3}deg)`}}>
        <div style={{fontSize: 30, fontWeight: 800, letterSpacing: 4, color: pal.muted, textTransform: 'uppercase'}}>{props.source}</div>
        <div style={{marginTop: 26, fontSize: 64, lineHeight: 1.15, fontWeight: 800, color: pal.text, letterSpacing: -1.5}}>
          {parts[0]}
          {parts.length > 1 ? (
            <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
              <span style={{position: 'absolute', left: -6, right: -6, bottom: 4, height: 30, background: '#FDE047', transformOrigin: 'left', transform: `scaleX(${hl})`, borderRadius: 6, zIndex: 0}} />
              <span style={{position: 'relative'}}>{props.mark}</span>
            </span>
          ) : null}
          {parts[1] ?? ''}
        </div>
        <div style={{marginTop: 30, fontSize: 26, fontWeight: 600, color: pal.muted}}>Paraphrased from the report</div>
      </div>
      {props.stamp ? (() => {
        const sp = interpolate(frame, [at(beats, 2), at(beats, 2) + 7], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
        return sp > 0 ? (
          <div style={{position: 'absolute', right: 70, top: 600, padding: '14px 34px', borderRadius: 16, border: `6px solid ${pal.alert}`, color: pal.alert, fontFamily: theme.font, fontWeight: 900, fontSize: 64, letterSpacing: 4, transform: `rotate(${-10 + (1 - sp) * 20}deg) scale(${interpolate(sp, [0, 1], [2, 1])})`, opacity: Math.min(1, sp * 1.5), background: rgba(pal.alert, 0.06)}}>
            {props.stamp}
          </div>
        ) : null;
      })() : null}
    </Stage>
  );
};

/** Fish & chips with passport-style stamps landing one per beat after beat 0, and a ship circling. */
export const Souvenir: React.FC<SceneProps<{stamps: string[]}>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pal = usePal();
  const enter = spring({frame: frame - at(beats, 0), fps, durationInFrames: 16, config: {damping: 13}});
  const spots = [
    {x: 180, y: 170, r: -12},
    {x: 820, y: 200, r: 10},
    {x: 170, y: 690, r: 8},
    {x: 830, y: 700, r: -9},
  ];
  const colors = ['#2563EB', '#DC2626', '#16A34A', '#7C3AED'];
  const orbit = (frame / 90) * Math.PI * 2;
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <ellipse cx={500} cy={450} rx={420} ry={300} fill="none" stroke={pal.dim} strokeWidth={4} strokeDasharray="4 16" strokeLinecap="round" />
        <g transform={`translate(${500 + Math.cos(orbit) * 420} ${450 + Math.sin(orbit) * 300})`}>
          <text fontSize={54} textAnchor="middle" y={18}>🚢</text>
        </g>
        <g transform={`translate(500 470) scale(${enter * 1.25}) translate(-210 -150)`}>
          <FishChips />
        </g>
        {props.stamps.map((s, i) => {
          const st = at(beats, i + 1);
          const p = interpolate(frame, [st, st + 7], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
          if (p <= 0) return null;
          const sp = spots[i % spots.length];
          const c = colors[i % colors.length];
          return (
            <g key={i} transform={`translate(${sp.x} ${sp.y}) rotate(${sp.r + (1 - p) * 20}) scale(${interpolate(p, [0, 1], [2.2, 1])})`} opacity={Math.min(1, p * 1.4)}>
              <rect x={-130} y={-56} width={260} height={112} rx={18} fill={rgba(c, 0.06)} stroke={c} strokeWidth={6} />
              <rect x={-118} y={-44} width={236} height={88} rx={12} fill="none" stroke={c} strokeWidth={2} strokeDasharray="6 6" />
              <text x={0} y={14} textAnchor="middle" fontFamily={theme.font} fontWeight={900} fontSize={40} letterSpacing={3} fill={c}>{s}</text>
            </g>
          );
        })}
      </svg>
      <div style={{display: 'none'}}>{rnd(1)}</div>
    </Stage>
  );
};

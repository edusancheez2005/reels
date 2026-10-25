import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, rnd, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A scrolling wall of public transactions. Beats: 0 wall speeds up, 1..n-2 random rows flash,
 * last beat: the highlighted transaction slides to the centre inside a selection box.
 */
type P = {highlight: {hash: string; amount: string}; title?: string};

const HEX = '0123456789abcdef';
const hash = (s: number) => {
  let h = '';
  for (let i = 0; i < 10; i++) h += HEX[Math.floor(rnd(s * 31 + i * 7) * 16)];
  let t = '';
  for (let i = 0; i < 6; i++) t += HEX[Math.floor(rnd(s * 17 + i * 13 + 5) * 16)];
  return `${h}…${t}`;
};
const amt = (s: number) => {
  const v = Math.pow(10, rnd(s * 3.3) * 3.2 - 2);
  return `${v.toFixed(v < 1 ? 4 : 2)} BTC`;
};

export const TxWall: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const ROW = 64;
  const COLS = 2;
  const speed = interpolate(frame, [0, revealFrame(beats, 0)], [3, 9], {extrapolateRight: 'clamp'});
  const scroll = frame * speed;
  const last = beats.length - 1;
  const hl = interpolate(frame, [revealFrame(beats, last) - LEAD_FRAMES, revealFrame(beats, last) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const flashes = beats.slice(1, Math.max(1, last)).map((b) => b);
  const rows = 18;
  return (
    <Stage>
      <div style={{position: 'absolute', inset: '0 0 0 0', overflow: 'hidden', borderRadius: 30, maskImage: 'linear-gradient(transparent, black 18%, black 82%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, black 18%, black 82%, transparent)'}}>
        {Array.from({length: COLS}).map((_, c) => (
          <div key={c} style={{position: 'absolute', left: c * 500 + 10, width: 480, top: -((scroll + c * 200) % ROW) - ROW}}>
            {Array.from({length: rows}).map((__, r) => {
              const seed = Math.floor((scroll + c * 200) / ROW) + r + c * 1000;
              const flashOn = flashes.some((b, j) => {
                const local = frame - b;
                return local >= -2 && local < 10 && (seed + j) % 5 === 0;
              });
              return (
                <div key={r} style={{height: ROW, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontFamily: theme.mono, fontSize: 26, color: flashOn ? pal.text : pal.dim, background: flashOn ? rgba(pal.accent, 0.18) : 'transparent', borderBottom: `1px solid ${pal.grid}`, opacity: 1 - hl * 0.6}}>
                  <span>{hash(seed)}</span>
                  <span>{amt(seed)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {props.title ? (
        <div style={{position: 'absolute', top: -10, left: 0, right: 0, textAlign: 'center', fontFamily: theme.font, fontWeight: 800, letterSpacing: 6, fontSize: 28, color: pal.muted}}>{props.title}</div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 390,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 34px',
          borderRadius: 18,
          background: pal.panel,
          border: `4px solid #3D86FF`,
          boxShadow: `0 0 60px ${rgba('#3D86FF', 0.45)}`,
          fontFamily: theme.mono,
          fontSize: 38,
          color: pal.text,
          opacity: hl,
          transform: `translateY(${(1 - hl) * 160}px) scale(${0.9 + hl * 0.1})`,
        }}
      >
        <span>{props.highlight.hash}</span>
        <span style={{fontWeight: 700, color: pal.accent}}>{props.highlight.amount}</span>
      </div>
    </Stage>
  );
};

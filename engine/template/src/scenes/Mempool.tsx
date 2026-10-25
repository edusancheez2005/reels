import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, rnd, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * An isometric pool of pending transactions (CSS 3D).
 * mode "fill": tiles rain in from beat 0; beat 1 shows the pool label; beat 2 drops the highlighted tx in.
 * mode "scan": a scanning beam sweeps on beat 0; tiles get read (tick) progressively; beat 2 = all read.
 */
type P = {mode?: 'fill' | 'scan'; label?: string; highlight?: string; reader?: string};

const N = 9;

export const Mempool: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const mode = props.mode ?? 'fill';
  const b0 = revealFrame(beats, 0) - LEAD_FRAMES;
  const b1 = revealFrame(beats, 1) - LEAD_FRAMES;
  const b2 = revealFrame(beats, 2) - LEAD_FRAMES;
  const TILE = 62;
  const GAP = 10;
  const size = N * TILE + (N - 1) * GAP;
  const scanX = mode === 'scan' ? interpolate(frame, [b0, durationInFrames - 4], [-0.15, 1.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : -1;
  const labelP = interpolate(frame, [b1, b1 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hlP = interpolate(frame, [b2 - 10, b2 + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const HI = {r: 4, c: 4};
  const fees = ['#5A3FD8', '#3D5BF5', '#2F7BF6', '#2A9DF4', '#1CB8C9', '#32C48D'];

  return (
    <Stage>
      <div style={{position: 'absolute', left: 500 - size / 2, top: 400 - size / 2, width: size, height: size, perspective: 2400}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(58deg) rotateZ(-40deg) rotateZ(${Math.sin(frame / 50) * 2}deg)`}}>
          <div style={{position: 'absolute', inset: -24, borderRadius: 26, border: `3px dashed ${rgba(pal.text, 0.18)}`, background: rgba(pal.accent, 0.05)}} />
          {Array.from({length: N * N}).map((_, i) => {
            const r = Math.floor(i / N);
            const c = i % N;
            const isHi = r === HI.r && c === HI.c;
            const delay = rnd(i * 3.1) * (mode === 'fill' ? Math.max(8, b1 - 6) : 0);
            const drop = mode === 'fill' ? interpolate(frame, [b0 + delay - 14, b0 + delay], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}) : 0;
            const dropHi = isHi && mode === 'fill' ? 1 - hlP : 0;
            const z = (isHi ? dropHi : drop) * 500;
            const visible = isHi && mode === 'fill' ? frame >= b2 - 10 : mode === 'scan' || frame >= b0 + delay - 14;
            const read = mode === 'scan' && (c + 0.5) / N < scanX;
            const color = isHi ? '#F7931A' : fees[Math.floor(rnd(i * 5.5) * fees.length)];
            const h = isHi ? 46 : 14 + rnd(i * 2.7) * 24;
            if (!visible) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: c * (TILE + GAP),
                  top: r * (TILE + GAP),
                  width: TILE,
                  height: TILE,
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(${z}px)`,
                }}
              >
                {/* top face */}
                <div style={{position: 'absolute', inset: 0, borderRadius: 8, background: color, transform: `translateZ(${h}px)`, boxShadow: isHi ? `0 0 40px ${rgba('#F7931A', 0.9)}` : 'none', opacity: read ? 1 : mode === 'scan' ? 0.55 : 0.95}}>
                  {read ? <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 34, fontWeight: 900, transform: 'rotateZ(40deg)'}}>✓</div> : null}
                </div>
                {/* side faces */}
                <div style={{position: 'absolute', left: 0, bottom: 0, width: TILE, height: h, background: `linear-gradient(${color}, ${rgba('#000000', 0.6)})`, transformOrigin: 'bottom', transform: 'rotateX(-90deg)', filter: 'brightness(0.65)'}} />
                <div style={{position: 'absolute', right: 0, top: 0, width: h, height: TILE, background: color, transformOrigin: 'right', transform: 'rotateY(90deg)', filter: 'brightness(0.45)'}} />
              </div>
            );
          })}
          {mode === 'scan' && scanX > -0.1 && scanX < 1.1 ? (
            <div style={{position: 'absolute', top: -40, bottom: -40, left: `${scanX * 100}%`, width: 10, background: pal.accent, boxShadow: `0 0 60px 20px ${rgba(pal.accent, 0.55)}`, transform: 'translateZ(90px)', borderRadius: 6}} />
          ) : null}
        </div>
      </div>
      {props.label ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: theme.font, fontWeight: 800, fontSize: 54, color: pal.text, opacity: labelP, transform: `translateY(${(1 - labelP) * 20}px)`}}>
          {props.label}
        </div>
      ) : null}
      {mode === 'fill' && props.highlight ? (
        <div style={{position: 'absolute', left: 560, top: 150, fontFamily: theme.mono, fontWeight: 700, fontSize: 34, color: '#F7931A', padding: '12px 22px', borderRadius: 14, background: pal.panel, border: `2px solid ${rgba('#F7931A', 0.7)}`, opacity: interpolate(frame, [b2, b2 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          {props.highlight}
        </div>
      ) : null}
      {mode === 'scan' && props.reader ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: theme.mono, fontWeight: 700, fontSize: 36, color: pal.accent, opacity: interpolate(frame, [b1, b1 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          {props.reader} {Math.min(N * N, Math.max(0, Math.round(scanX * N * N)))}/{N * N}
        </div>
      ) : null}
    </Stage>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/** Entrances start this many frames before their anchor word, so the motion onset lands on the word. */
export const LEAD_FRAMES = 2;
/** Items beyond the provided beats cascade in this many frames apart. */
export const CASCADE = 6;

export type SceneProps<P> = {props: P; beats: number[]; durationInFrames: number};

/** Local frame at which item i should be revealed (its anchor word). */
export const revealFrame = (beats: number[], i: number) => {
  if (beats.length === 0) return i * CASCADE;
  if (i < beats.length) return beats[i];
  return beats[beats.length - 1] + (i - beats.length + 1) * CASCADE;
};

/** 0→1 progress of item i's entrance (snappy spring, ~9 frames). */
export const useReveal = (beats: number[], i: number, durationInFrames = 9) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = revealFrame(beats, i) - LEAD_FRAMES;
  const p = spring({frame: frame - start, fps, durationInFrames, config: {damping: 14, stiffness: 170, mass: 0.6}});
  return {p, shown: frame >= start, start, frame};
};

/** Eased 0→1 between two local frames. */
export const ramp = (frame: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [a, Math.max(a + 1, b)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

type RevealKind = 'slide' | 'pop' | 'fade' | 'left' | 'right' | 'drop';

/** Wrapper that animates its children in on beat i. */
export const Reveal: React.FC<{
  beats: number[];
  i: number;
  kind?: RevealKind;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({beats, i, kind = 'slide', style, children}) => {
  const {p} = useReveal(beats, i);
  const opacity = interpolate(p, [0, 0.35], [0, 1], {extrapolateRight: 'clamp'});
  const transform =
    kind === 'pop'
      ? `scale(${interpolate(p, [0, 1], [0.6, 1])})`
      : kind === 'left'
        ? `translateX(${(1 - p) * -70}px)`
        : kind === 'right'
          ? `translateX(${(1 - p) * 70}px)`
          : kind === 'drop'
            ? `translateY(${(1 - p) * -60}px)`
            : kind === 'fade'
              ? 'none'
              : `translateY(${(1 - p) * 44}px)`;
  return <div style={{opacity, transform, ...style}}>{children}</div>;
};

/** Slow push-in across the scene keeps static shots alive. */
export const usePushIn = (durationInFrames: number, to = 1.05) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, durationInFrames], [1, to], {extrapolateRight: 'clamp'});
};

/**
 * 1000×900 design stage, scaled to the full 1080 width and placed under the caption band
 * (visual area y ≈ 430–1410 on the 1080×1920 canvas).
 */
export const STAGE = {w: 1000, h: 900, top: 430, height: 980};
export const Stage: React.FC<{children: React.ReactNode; push?: number; overflow?: boolean}> = ({children, push = 1}) => {
  const s = Math.min(1080 / STAGE.w, STAGE.height / STAGE.h);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: STAGE.top + (STAGE.height - STAGE.h * s) / 2,
          left: (1080 - STAGE.w * s) / 2,
          width: STAGE.w,
          height: STAGE.h,
          transform: `scale(${s})`,
          transformOrigin: 'top left',
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 50%'}}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Deterministic pseudo-random in [0,1) from an integer seed. */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

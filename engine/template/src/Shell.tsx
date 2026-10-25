import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {usePal} from './lib/palette';

/** Theme background: flat colour, faint grid (dark) or dots (light), soft vignette. */
export const Backdrop: React.FC = () => {
  const pal = usePal();
  const dark = pal.name === 'dark';
  return (
    <AbsoluteFill style={{background: pal.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: dark
            ? `linear-gradient(${pal.grid} 1px, transparent 1px), linear-gradient(90deg, ${pal.grid} 1px, transparent 1px)`
            : `radial-gradient(${pal.grid} 1.6px, transparent 1.7px)`,
          backgroundSize: dark ? '60px 60px' : '34px 34px',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 30%, transparent 85%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: dark
            ? 'radial-gradient(ellipse 90% 60% at 50% 45%, rgba(79,140,255,0.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 90% 70% at 50% 40%, rgba(255,255,255,0.7) 0%, transparent 70%)',
        }}
      />
    </AbsoluteFill>
  );
};

export type TransitionKind = 'cut' | 'pop' | 'whip' | 'zoom' | 'rise';

const IN = 7;
const OUT = 5;

/** Wraps a scene's content with its entrance transition and (if the next scene whips) an exit. */
export const SceneShell: React.FC<{
  kind?: TransitionKind;
  exit?: TransitionKind;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({kind = 'pop', exit, durationInFrames, children}) => {
  const frame = useCurrentFrame();
  const e = Easing.out(Easing.cubic);
  const tin = interpolate(frame, [0, IN], [1, 0], {extrapolateRight: 'clamp', easing: e}); // 1 → 0
  const tout = exit === 'whip' || exit === 'zoom' ? interpolate(frame, [durationInFrames - OUT, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}) : 0;

  let transform = '';
  let filter = '';
  let opacity = 1;
  if (kind === 'whip') {
    transform += `translateX(${tin * 340}px) scaleX(${1 + tin * 0.12}) `;
    filter += tin > 0.01 ? `blur(${tin * 26}px) ` : '';
  } else if (kind === 'zoom') {
    transform += `scale(${1 + tin * 0.35}) `;
    filter += tin > 0.01 ? `blur(${tin * 18}px) ` : '';
    opacity = 1 - tin * 0.6;
  } else if (kind === 'rise') {
    transform += `translateY(${tin * 120}px) `;
    filter += tin > 0.01 ? `blur(${tin * 10}px) ` : '';
    opacity = 1 - tin;
  } else if (kind === 'pop') {
    transform += `scale(${1 - tin * 0.05}) `;
    opacity = 1 - tin;
  }
  if (tout > 0) {
    if (exit === 'whip') {
      transform += `translateX(${-tout * 340}px) scaleX(${1 + tout * 0.12}) `;
      filter += `blur(${tout * 26}px) `;
    } else {
      transform += `scale(${1 - tout * 0.2}) `;
      filter += `blur(${tout * 14}px) `;
      opacity *= 1 - tout * 0.7;
    }
  }
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{transform: transform || undefined, filter: filter || undefined, opacity}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

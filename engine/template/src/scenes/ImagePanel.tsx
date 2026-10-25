import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {Reveal, Stage, useReveal, usePushIn, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {theme, alpha} from '../lib/theme';

type Box = {x: number; y: number; w: number; h: number};
type P = {src: string; label?: string; boxes?: Box[]};

const HighlightBox: React.FC<{b: Box; beats: number[]; i: number; dim: boolean}> = ({b, beats, i, dim}) => {
  const {p} = useReveal(beats, i);
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: 14,
        border: `5px solid ${theme.accent}`,
        boxShadow: `${dim ? `0 0 0 9999px ${alpha('#000000', 0.35 * p)}, ` : ''}0 0 30px ${alpha(theme.accent, 0.5)}`,
        opacity: p,
        transform: `scale(${1.15 - 0.15 * p})`,
      }}
    />
  );
};

export const ImagePanel: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const push = usePushIn(durationInFrames, 1.035);
  const frame = useCurrentFrame();
  const src = props.src.startsWith('http') ? props.src : staticFile(props.src);
  const boxes = props.boxes ?? [];
  // only the most recently revealed box dims the rest of the image
  let current = -1;
  boxes.forEach((_, k) => {
    if (frame >= revealFrame(beats, 1 + k) - LEAD_FRAMES) current = k;
  });
  return (
    <Stage push={push}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 28, overflow: 'hidden', border: `2px solid ${theme.line}`, background: theme.panel}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        {boxes.map((b, k) => (
          <HighlightBox key={k} b={b} beats={beats} i={1 + k} dim={k === current} />
        ))}
      </div>
      {props.label ? (
        <Reveal beats={beats} i={0} kind="pop" style={{position: 'absolute', top: -40, left: 30}}>
          <div style={{padding: '14px 28px', borderRadius: 999, background: theme.accent, color: '#fff', fontFamily: theme.font, fontWeight: 800, fontSize: 36}}>
            {props.label}
          </div>
        </Reveal>
      ) : null}
    </Stage>
  );
};

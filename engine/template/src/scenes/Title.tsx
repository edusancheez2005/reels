import React from 'react';
import {Reveal, Stage, usePushIn, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {usePal} from '../lib/palette';

type P = {lines: string[]; accent?: string[]; size?: number; align?: 'center' | 'left'};

const clean = (w: string) => w.toLowerCase().replace(/[^0-9a-z]/g, '');

export const Title: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const pal = usePal();
  const push = usePushIn(durationInFrames, 1.04);
  const accent = new Set((props.accent ?? []).map(clean));
  const size = props.size ?? 104;
  return (
    <Stage push={push}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: props.align === 'left' ? 'flex-start' : 'center',
          textAlign: props.align === 'left' ? 'left' : 'center',
          gap: size * 0.12,
          fontFamily: theme.font,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.02,
          letterSpacing: -2,
          color: pal.text,
        }}
      >
        {props.lines.map((line, i) => (
          <Reveal key={i} beats={beats} i={i}>
            {line.split(' ').map((w, j) => (
              <span key={j} style={{color: accent.has(clean(w)) ? pal.accent : undefined}}>
                {w}{' '}
              </span>
            ))}
          </Reveal>
        ))}
      </div>
    </Stage>
  );
};

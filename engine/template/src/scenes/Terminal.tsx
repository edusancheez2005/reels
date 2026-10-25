import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';

type P = {title?: string; lines: string[]};

export const Terminal: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <div style={{position: 'absolute', left: 10, right: 10, top: '50%', transform: 'translateY(-50%)', borderRadius: 26, overflow: 'hidden', background: '#07090D', border: `2px solid ${theme.line}`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '20px 26px', background: theme.panel, borderBottom: `1px solid ${theme.line}`}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c}} />
          ))}
          <div style={{marginLeft: 16, fontFamily: theme.font, fontSize: 28, color: theme.muted, fontWeight: 600}}>{props.title ?? 'terminal'}</div>
        </div>
        <div style={{padding: '30px 34px 40px', minHeight: 480, fontFamily: theme.mono, fontSize: 42, lineHeight: 1.45}}>
          {props.lines.map((line, i) => {
            const land = revealFrame(beats, i);
            const typeFrames = Math.min(14, Math.max(4, Math.round(line.length * 0.5)));
            const start = land - typeFrames - LEAD_FRAMES;
            if (frame < start) return null;
            const chars = Math.round(Math.min(1, (frame - start) / typeFrames) * line.length);
            const isCmd = line.startsWith('$ ');
            const isComment = line.startsWith('# ');
            const typing = chars < line.length;
            const isLast = i === props.lines.length - 1 || frame < revealFrame(beats, i + 1) - 14 - LEAD_FRAMES;
            const cursor = (typing || isLast) && Math.floor(frame / 8) % 2 === 0;
            return (
              <div key={i} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: isComment ? theme.muted : isCmd ? theme.text : theme.accent}}>
                {isCmd ? <span style={{color: '#28C840'}}>$ </span> : null}
                {(isCmd ? line.slice(2) : line).slice(0, Math.max(0, chars - (isCmd ? 2 : 0)))}
                {cursor ? <span style={{background: theme.text, color: theme.bg}}> </span> : null}
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};

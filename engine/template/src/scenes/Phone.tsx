import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal} from '../lib/palette';
import {theme} from '../lib/theme';

/** Phone lockscreen; one notification slides in per beat and the stack pushes down. */
type Notif = {app: string; title: string; body?: string; icon?: string; iconBg?: string; time?: string};
type P = {time?: string; date?: string; notifs: Notif[]; wallpaper?: [string, string]};

export const Phone: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pal = usePal();
  const PW = 440;
  const PH = 900;
  const enter = spring({frame, fps, durationInFrames: 16, config: {damping: 15, stiffness: 120}});
  const [w1, w2] = props.wallpaper ?? ['#1E3A34', '#0B1512'];
  const shown = props.notifs.map((_, i) => frame >= revealFrame(beats, i) - LEAD_FRAMES);
  const count = shown.filter(Boolean).length;
  const CARD = 132;
  return (
    <Stage>
      <div
        style={{
          position: 'absolute',
          left: 500 - PW / 2,
          top: 450 - PH / 2,
          width: PW,
          height: PH,
          borderRadius: 72,
          background: '#0D0D0F',
          padding: 14,
          boxSizing: 'border-box',
          boxShadow: `${pal.shadow}, inset 0 0 0 2px #3A3A40`,
          transform: `translateY(${(1 - enter) * 80}px) rotateX(${(1 - enter) * 12}deg)`,
          opacity: interpolate(enter, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      >
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 58, overflow: 'hidden', background: `radial-gradient(120% 80% at 30% 20%, ${w1}, ${w2})`, fontFamily: theme.font}}>
          <div style={{position: 'absolute', top: 14, left: '50%', width: 124, height: 36, marginLeft: -62, borderRadius: 20, background: '#000'}} />
          <div style={{position: 'absolute', top: 20, left: 36, right: 30, display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 20, fontWeight: 700}}>
            <span>{props.time ?? '9:41'}</span>
            <span style={{display: 'flex', gap: 6, alignItems: 'center'}}><span style={{display: 'flex', gap: 2, alignItems: 'flex-end'}}>{[6, 9, 12, 15].map((h) => <span key={h} style={{width: 4, height: h, borderRadius: 1, background: '#fff'}} />)}</span><span style={{width: 30, height: 14, borderRadius: 4, border: '2px solid #fff', boxSizing: 'border-box', padding: 1}}><span style={{display: 'block', width: '75%', height: '100%', background: '#fff', borderRadius: 1}} /></span></span>
          </div>
          <div style={{position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: 600}}>{props.date ?? 'Monday, 12 October'}</div>
          <div style={{position: 'absolute', top: 118, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.95)', fontSize: 108, fontWeight: 700, letterSpacing: -3}}>{props.time ?? '9:41'}</div>
          {props.notifs.map((nf, i) => {
            if (!shown[i]) return null;
            const st = revealFrame(beats, i) - LEAD_FRAMES;
            const p = spring({frame: frame - st, fps, durationInFrames: 12, config: {damping: 15, stiffness: 170}});
            // newest on top: position index from top = (count-1 - i)
            const order = count - 1 - i;
            const y = 280 + order * (CARD + 12);
            const dim = order > 2 ? 0 : 1 - order * 0.08;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  top: y,
                  height: CARD,
                  borderRadius: 28,
                  background: 'rgba(245,245,247,0.86)',
                  backdropFilter: 'blur(18px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  padding: '18px 20px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  gap: 16,
                  opacity: interpolate(p, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}) * dim,
                  transform: `translateY(${(1 - p) * -90}px) scale(${0.9 + p * 0.1})`,
                  transition: 'none',
                }}
              >
                <div style={{flex: '0 0 auto', width: 52, height: 52, borderRadius: 13, background: nf.iconBg ?? '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#fff', fontWeight: 800}}>{nf.icon ?? nf.app[0]}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: '#6B6B73', letterSpacing: 1, textTransform: 'uppercase'}}>
                    <span>{nf.app}</span>
                    <span style={{textTransform: 'none', letterSpacing: 0, fontWeight: 500}}>{nf.time ?? 'now'}</span>
                  </div>
                  <div style={{fontSize: 23, fontWeight: 800, color: '#111', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{nf.title}</div>
                  {nf.body ? <div style={{fontSize: 20, fontWeight: 500, color: '#3A3A42', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{nf.body}</div> : null}
                </div>
              </div>
            );
          })}
          <div style={{position: 'absolute', bottom: 12, left: '50%', width: 150, height: 6, marginLeft: -75, borderRadius: 3, background: 'rgba(255,255,255,0.8)'}} />
        </div>
      </div>
      <div style={{display: 'none'}}>{Easing.linear(0)}</div>
    </Stage>
  );
};

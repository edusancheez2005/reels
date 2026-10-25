import React from 'react';
import {interpolate} from 'remotion';
import {Reveal, Stage, useReveal, type SceneProps} from '../lib/anim';
import {theme, tone, alpha} from '../lib/theme';

type Row = {label: string; value: string; tone?: 'accent' | 'alert' | 'muted'};
type P = {url?: string; title?: string; rows: Row[]; highlight?: number};

export const Window: React.FC<SceneProps<P>> = ({props, beats}) => {
  const {p: hl} = useReveal(beats, props.rows.length);
  return (
    <Stage>
      <Reveal beats={[0]} i={0} kind="fade" style={{position: 'absolute', inset: 0}}>
        <div style={{position: 'absolute', left: 10, width: 980, top: '50%', transform: 'translateY(-50%)', borderRadius: 26, overflow: 'hidden', background: theme.panel, border: `2px solid ${theme.line}`, boxShadow: '0 30px 80px rgba(0,0,0,0.45)', fontFamily: theme.font}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', borderBottom: `1px solid ${theme.line}`, background: '#10141C'}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
            ))}
            {props.url ? (
              <div style={{marginLeft: 18, flex: 1, padding: '10px 20px', borderRadius: 14, background: theme.bg, color: theme.muted, fontSize: 30, fontFamily: theme.mono}}>
                {props.url}
              </div>
            ) : null}
          </div>
          {props.title ? <div style={{padding: '34px 38px 10px', fontSize: 58, fontWeight: 800, color: theme.text}}>{props.title}</div> : null}
          <div style={{padding: '12px 22px 30px'}}>
            {props.rows.map((r, i) => {
              const on = props.highlight === i ? hl : 0;
              return (
                <Reveal key={i} beats={beats} i={i}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 20,
                      padding: '28px 18px',
                      borderRadius: 16,
                      borderTop: i ? `1px solid ${theme.line}` : 'none',
                      background: alpha(theme.accent, 0.14 * on),
                      outline: on > 0 ? `3px solid ${alpha(theme.accent, on)}` : 'none',
                      transform: `scale(${interpolate(on, [0, 1], [1, 1.03])})`,
                    }}
                  >
                    <div style={{fontSize: 42, color: theme.muted, fontWeight: 600}}>{r.label}</div>
                    <div style={{fontSize: 46, color: tone(r.tone), fontWeight: 800, fontFamily: theme.mono, textAlign: 'right'}}>{r.value}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>
    </Stage>
  );
};

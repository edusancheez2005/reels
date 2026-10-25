import React from 'react';
import {Reveal, Stage, type SceneProps} from '../lib/anim';
import {theme, alpha} from '../lib/theme';

type Item = {label: string; sub?: string; icon?: string};
type P = {items: Item[]};

export const Steps: React.FC<SceneProps<P>> = ({props, beats}) => {
  const n = props.items.length;
  const arrow = 46;
  const cardH = Math.min(170, (900 - arrow * (n - 1)) / n);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font}}>
        {props.items.map((it, i) => (
          <Reveal key={i} beats={beats} i={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            {i > 0 ? (
              <div style={{height: arrow, display: 'flex', alignItems: 'center', color: theme.accent, fontSize: 40, lineHeight: 1}}>↓</div>
            ) : null}
            <div
              style={{
                width: 820,
                height: cardH,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '0 36px',
                borderRadius: 28,
                background: theme.panel,
                border: `2px solid ${i === n - 1 ? theme.accent : theme.line}`,
                boxShadow: i === n - 1 ? `0 0 40px ${alpha(theme.accent, 0.25)}` : 'none',
              }}
            >
              <div
                style={{
                  flex: '0 0 auto',
                  width: cardH * 0.56,
                  height: cardH * 0.56,
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: alpha(theme.accent, 0.15),
                  color: theme.accent,
                  fontSize: cardH * 0.3,
                  fontWeight: 800,
                }}
              >
                {it.icon ?? i + 1}
              </div>
              <div>
                <div style={{fontSize: Math.min(52, cardH * 0.34), fontWeight: 800, color: theme.text, lineHeight: 1.05}}>{it.label}</div>
                {it.sub ? <div style={{fontSize: Math.min(32, cardH * 0.2), fontWeight: 500, color: theme.muted, marginTop: 6}}>{it.sub}</div> : null}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Stage>
  );
};

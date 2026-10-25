import React from 'react';
import {Reveal, Stage, useReveal, type SceneProps} from '../lib/anim';
import {theme, tone, alpha} from '../lib/theme';

type Col = {title: string; tone?: 'accent' | 'alert' | 'muted'; items: string[]};
type P = {left: Col; right: Col; verdict?: 'left' | 'right'};

/**
 * Reveal order follows how a comparison is spoken:
 *   left.title, left.items…, right.title, right.items…, then verdict.
 */
export const Compare: React.FC<SceneProps<P>> = ({props, beats}) => {
  const leftN = 1 + props.left.items.length;
  const rightN = 1 + props.right.items.length;
  const {p: v} = useReveal(beats, leftN + rightN);

  const col = (side: 'left' | 'right', c: Col, base: number) => {
    const win = props.verdict === side ? v : 0;
    const color = tone(c.tone ?? (side === 'left' ? 'muted' : 'accent'));
    return (
      <div
        style={{
          flex: 1,
          
          borderRadius: 30,
          padding: '46px 26px', minHeight: 520,
          background: theme.panel,
          border: `3px solid ${win > 0 ? alpha(theme.accent, win) : alpha(color, 0.35)}`,
          boxShadow: win > 0 ? `0 0 50px ${alpha(theme.accent, 0.3 * win)}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 26,
        }}
      >
        <Reveal beats={beats} i={base} kind="pop">
          <div style={{fontSize: 64, fontWeight: 800, color, textAlign: 'center', letterSpacing: -1, lineHeight: 1.05}}>{c.title}</div>
        </Reveal>
        {c.items.map((it, k) => (
          <Reveal key={k} beats={beats} i={base + 1 + k}>
            <div style={{fontSize: 50, fontWeight: 700, color: theme.text, textAlign: 'center', padding: '18px 6px', borderTop: `1px solid ${theme.line}`, lineHeight: 1.15}}>
              {it}
            </div>
          </Reveal>
        ))}
      </div>
    );
  };
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 28, fontFamily: theme.font}}>
        {col('left', props.left, 0)}
        {col('right', props.right, leftN)}
      </div>
    </Stage>
  );
};

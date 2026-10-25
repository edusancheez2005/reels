import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Stage, useReveal, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, toneOf, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * Nodes (with optional real logo images) and arrows on the 1000×900 stage, theme-aware.
 * Elements reveal in `order` (node ids, or "from>to" for edges), one per beat.
 * Edges with `flow: true` carry moving dots once drawn. `cross` on a node draws a ✕ over it on the given order slot.
 */
type Node = {id: string; label?: string; sub?: string; x: number; y: number; icon?: string; logo?: string; tone?: string; size?: number; cross?: boolean; badge?: string};
type Edge = {from: string; to: string; label?: string; dashed?: boolean; flow?: boolean; tone?: string};
type P = {nodes: Node[]; edges: Edge[]; order?: (string | string[])[]};

const NodeView: React.FC<{n: Node; beats: number[]; i: number; crossI: number}> = ({n, beats, i, crossI}) => {
  const pal = usePal();
  const {p} = useReveal(beats, i);
  const {p: cp} = useReveal(beats, crossI);
  const color = toneOf(pal, n.tone ?? 'accent');
  const S = n.size ?? 1;
  const logo = n.logo ? (n.logo.startsWith('http') ? n.logo : staticFile(n.logo)) : null;
  return (
    <div
      style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.5, 1]) * S})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        fontFamily: theme.font,
      }}
    >
      {logo || n.icon ? (
        <div style={{position: 'relative', width: 168, height: 168, borderRadius: 42, background: logo ? '#fff' : pal.panel, border: logo ? 'none' : `2.5px solid ${rgba(color, 0.8)}`, boxShadow: `${pal.shadow}, 0 0 40px ${rgba(color, 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 82, color}}>
          {logo ? <Img src={logo} style={{width: 102, height: 102}} /> : n.icon}
          {n.cross && cp > 0 ? (
            <svg width={168} height={168} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <line x1={-14} y1={-14} x2={-14 + 196 * cp} y2={-14 + 196 * cp} stroke={pal.alert} strokeWidth={10} strokeLinecap="round" />
            </svg>
          ) : null}
          {n.badge ? (
            <div style={{position: 'absolute', right: -16, top: -16, padding: '6px 12px', borderRadius: 14, background: color, color: '#fff', fontSize: 22, fontWeight: 800}}>{n.badge}</div>
          ) : null}
        </div>
      ) : null}
      {n.label ? (
        <div style={{padding: logo || n.icon ? 0 : '18px 30px', borderRadius: 22, background: logo || n.icon ? 'transparent' : pal.panel, border: logo || n.icon ? 'none' : `2px solid ${rgba(color, 0.6)}`, fontSize: 48, fontWeight: 800, color: pal.text, whiteSpace: 'nowrap', textAlign: 'center'}}>
          {n.label}
          {n.sub ? <div style={{fontSize: 26, fontWeight: 600, color: pal.muted, marginTop: 4, fontFamily: n.sub.match(/^[0-9a-z]{6,}/) ? theme.mono : theme.font}}>{n.sub}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

export const Flow: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const byId = Object.fromEntries(props.nodes.map((n) => [n.id, n]));
  const order = props.order ?? [...props.nodes.map((n) => n.id), ...props.edges.map((e) => `${e.from}>${e.to}`)];
  const idx = (key: string) => {
    const i = order.findIndex((o) => (Array.isArray(o) ? o.includes(key) : o === key));
    return i < 0 ? order.length : i;
  };
  const R = 118;
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {props.edges.map((e, k) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          const st = revealFrame(beats, idx(`${e.from}>${e.to}`)) - LEAD_FRAMES;
          const p = interpolate(frame, [st, st + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (p <= 0) return null;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * R;
          const y1 = a.y + uy * R;
          const x2 = b.x - ux * R;
          const y2 = b.y - uy * R;
          const L = Math.hypot(x2 - x1, y2 - y1);
          const color = toneOf(pal, e.tone ?? 'accent');
          const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={e.dashed ? '14 14' : undefined} opacity={0.9} />
              {p >= 1 ? <polygon points="0,0 -24,-13 -24,13" fill={color} transform={`translate(${x2},${y2}) rotate(${ang})`} /> : null}
              {e.flow && p >= 1
                ? [0, 1, 2].map((j) => {
                    const t = ((frame - st) / 22 + j / 3) % 1;
                    return <circle key={j} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={9} fill={color} opacity={0.9} />;
                  })
                : null}
              {e.label ? (
                <text x={(x1 + x2) / 2 + (Math.abs(uy) > 0.7 ? 26 : 0)} y={(y1 + y2) / 2 - (Math.abs(uy) > 0.7 ? 0 : 22)} textAnchor={Math.abs(uy) > 0.7 ? 'start' : 'middle'} fontFamily={theme.font} fontSize={34} fontWeight={700} fill={pal.muted} opacity={p}>
                  {e.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {props.nodes.map((n) => (
        <NodeView key={n.id} n={n} beats={beats} i={idx(n.id)} crossI={idx(`x:${n.id}`)} />
      ))}
    </Stage>
  );
};

import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Stage, useReveal, revealFrame, type SceneProps} from '../lib/anim';
import {theme, tone, alpha} from '../lib/theme';

type Node = {id: string; label: string; x: number; y: number; icon?: string; tone?: 'accent' | 'alert' | 'muted'};
type Edge = {from: string; to: string; label?: string; dashed?: boolean};
type P = {nodes: Node[]; edges: Edge[]; order?: string[]; pulse?: string};

const R = 110; // keep edges clear of node boxes

const NodeBox: React.FC<{n: Node; beats: number[]; i: number}> = ({n, beats, i}) => {
  const {p} = useReveal(beats, i);
  const color = n.tone ? tone(n.tone) : theme.accent;
  return (
    <div
      style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.5, 1])})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '24px 36px',
        borderRadius: 28,
        background: theme.panel,
        border: `2px solid ${alpha(color, 0.8)}`,
        boxShadow: `0 0 36px ${alpha(color, 0.22)}`,
        whiteSpace: 'nowrap',
        fontFamily: theme.font,
      }}
    >
      {n.icon ? <span style={{fontSize: 58, color}}>{n.icon}</span> : null}
      <span style={{fontSize: 52, fontWeight: 800, color: theme.text}}>{n.label}</span>
    </div>
  );
};

const EdgeLine: React.FC<{e: Edge; a: Node; b: Node; beats: number[]; i: number}> = ({e, a, b, beats, i}) => {
  const {p} = useReveal(beats, i, 14);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const x1 = a.x + ux * R, y1 = a.y + uy * R * 0.6;
  const x2 = b.x - ux * R, y2 = b.y - uy * R * 0.6;
  const L = Math.hypot(x2 - x1, y2 - y1);
  const head = 22;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={theme.accent}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={e.dashed ? '14 14' : `${L} ${L}`}
        strokeDashoffset={e.dashed ? 0 : L * (1 - p)}
        opacity={e.dashed ? p : 1}
      />
      <polygon
        points={`0,0 ${-head},${-head * 0.55} ${-head},${head * 0.55}`}
        fill={theme.accent}
        transform={`translate(${x2},${y2}) rotate(${(ang * 180) / Math.PI})`}
        opacity={p > 0.85 ? 1 : 0}
      />
      {e.label ? (
        <text x={(x1 + x2) / 2 + 20} y={(y1 + y2) / 2} fill={theme.muted} fontSize={40} fontWeight={700} fontFamily={theme.font} opacity={p}>
          {e.label}
        </text>
      ) : null}
    </g>
  );
};

export const Diagram: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const byId = Object.fromEntries(props.nodes.map((n) => [n.id, n]));
  const order = props.order ?? [...props.nodes.map((n) => n.id), ...props.edges.map((e) => `${e.from}>${e.to}`)];
  const idx = (key: string) => {
    const i = order.indexOf(key);
    return i < 0 ? order.length : i;
  };
  const pulseNode = props.pulse ? byId[props.pulse] : undefined;
  const pulseStart = revealFrame(beats, order.length - 1);
  const pulseT = frame - pulseStart;
  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {props.edges.map((e, k) =>
          byId[e.from] && byId[e.to] ? <EdgeLine key={k} e={e} a={byId[e.from]} b={byId[e.to]} beats={beats} i={idx(`${e.from}>${e.to}`)} /> : null,
        )}
        {pulseNode && pulseT >= 0
          ? [0, 12].map((off) => {
              const t = ((pulseT + off) % 24) / 24;
              return <circle key={off} cx={pulseNode.x} cy={pulseNode.y} r={60 + t * 140} fill="none" stroke={theme.accent} strokeWidth={4} opacity={1 - t} />;
            })
          : null}
      </svg>
      {props.nodes.map((n) => (
        <NodeBox key={n.id} n={n} beats={beats} i={idx(n.id)} />
      ))}
    </Stage>
  );
};

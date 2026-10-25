import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A timeline ruler (years with monthly ticks). On beat i the playhead glides to marks[i]
 * and its label drops in. An optional `span` bracket between two marks appears on the beat after the last mark.
 */
type Mark = {at: number; label: string; sub?: string};
type P = {from: number; to: number; marks: Mark[]; span?: {a: number; b: number; label: string}};

export const Ruler: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const X0 = 40;
  const X1 = 960;
  const Y = 470;
  const x = (t: number) => X0 + ((t - props.from) / (props.to - props.from)) * (X1 - X0);
  const years: number[] = [];
  for (let y = Math.ceil(props.from); y <= props.to; y++) years.push(y);
  const months: number[] = [];
  for (let m = Math.ceil(props.from * 12); m / 12 <= props.to; m++) months.push(m / 12);

  // playhead position
  let ph = props.marks[0]?.at ?? props.from;
  let phStart = props.from;
  let st = 0;
  props.marks.forEach((mk, i) => {
    const f = revealFrame(beats, i) - LEAD_FRAMES - 6;
    if (frame >= f) {
      phStart = i === 0 ? props.from : props.marks[i - 1].at;
      ph = mk.at;
      st = f;
    }
  });
  const first = revealFrame(beats, 0) - LEAD_FRAMES - 6;
  const pm = frame < first ? 0 : interpolate(frame, [st, st + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const head = frame < first ? props.from : phStart + (ph - phStart) * pm;
  const draw = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  const spanBeat = revealFrame(beats, props.marks.length) - LEAD_FRAMES;
  const sp = props.span ? interpolate(frame, [spanBeat, spanBeat + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 0;
  const yellow = pal.name === 'light' ? '#D99A00' : '#F5C542';

  return (
    <Stage>
      <svg width={1000} height={900} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {months.map((m, i) => {
          const isYear = Math.abs(m - Math.round(m)) < 1e-6;
          const xx = x(m);
          if (xx > X0 + (X1 - X0) * draw) return null;
          return <line key={i} x1={xx} x2={xx} y1={Y} y2={Y - (isYear ? 46 : 18)} stroke={isYear ? pal.text : pal.dim} strokeWidth={isYear ? 4 : 2.5} opacity={isYear ? 0.95 : 0.7} />;
        })}
        <line x1={X0} x2={X0 + (X1 - X0) * draw} y1={Y} y2={Y} stroke={pal.dim} strokeWidth={2} />
        {years.map((y) => (
          <text key={y} x={x(y)} y={Y + 52} textAnchor="middle" fontFamily={theme.mono} fontSize={38} fontWeight={700} fill={pal.muted} opacity={draw}>
            {y}
          </text>
        ))}
        {/* span bracket */}
        {props.span && sp > 0 ? (
          <g opacity={sp}>
            <rect x={x(props.marks[props.span.a].at)} y={Y - 12} width={(x(props.marks[props.span.b].at) - x(props.marks[props.span.a].at)) * sp} height={24} rx={12} fill={rgba(pal.accent, 0.35)} />
            <text x={(x(props.marks[props.span.a].at) + x(props.marks[props.span.b].at)) / 2} y={Y + 132} textAnchor="middle" fontFamily={theme.font} fontSize={72} fontWeight={800} fill={pal.text}>
              {props.span.label}
            </text>
          </g>
        ) : null}
        {/* playhead */}
        <g opacity={frame >= first ? 1 : 0}>
          <line x1={x(head)} x2={x(head)} y1={120} y2={Y + 18} stroke={yellow} strokeWidth={3} strokeDasharray="6 7" />
          <circle cx={x(head)} cy={Y} r={11} fill={yellow} />
        </g>
        {/* mark labels */}
        {props.marks.map((mk, i) => {
          const f = revealFrame(beats, i) - LEAD_FRAMES + 8;
          const p = interpolate(frame, [f, f + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
          if (p <= 0) return null;
          const xx = x(mk.at);
          const anchor = xx < 260 ? 'start' : xx > 740 ? 'end' : 'middle';
          const dx = anchor === 'start' ? -10 : anchor === 'end' ? 10 : 0;
          return (
            <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * -20})`}>
              <line x1={xx} x2={xx} y1={Y - 60} y2={Y - 160} stroke={pal.dim} strokeWidth={2} strokeDasharray="3 6" />
              <text x={xx + dx} y={Y - 250} textAnchor={anchor} fontFamily={theme.font} fontSize={66} fontWeight={800} fill={pal.text}>
                {mk.label}
              </text>
              {mk.sub ? (
                <text x={xx + dx} y={Y - 192} textAnchor={anchor} fontFamily={theme.mono} fontSize={38} fontWeight={700} fill={yellow}>
                  {mk.sub}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </Stage>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {theme} from './lib/theme';
import {PALETTES} from './lib/palette';

/**
 * Chapter bar (Edu, 30 Oct 2026, after watcher.guru's "How Binance got hacked" reel): a fixed title + date, and a line of
 * chapters (VAULT · LAPTOP · SIGNATURE · DRAIN · FREEZE) with a glowing dot that travels as the story goes. Viewers always
 * see where they are and how much is left, which keeps them watching to the end.
 * storyboard: "header": {"title", "date"}, "chapters": [{"anchor", "label"}] (build_timeline resolves anchors to frames).
 */
export type Chapter = {label: string; from: number};
export type Header = {title: string; date?: string};

const X0 = 72;
const X1 = 1008;
const Y_TITLE = 104;
const Y_LINE = 158;
const Y_LABEL = 196;

export const ChapterBar: React.FC<{header?: Header; chapters: Chapter[]; durationInFrames: number}> = ({header, chapters, durationInFrames}) => {
  const frame = useCurrentFrame();
  const acc = PALETTES.dark.accent;
  const n = Math.max(1, chapters.length);
  // chapters sit at i/n along the line; the last chapter's dot keeps travelling to the end of the line
  const xs = chapters.map((_, i) => X0 + ((X1 - X0) * i) / n);
  let cur = 0;
  chapters.forEach((c, i) => {
    if (frame >= c.from) cur = i;
  });
  const start = chapters[cur]?.from ?? 0;
  const end = cur + 1 < chapters.length ? chapters[cur + 1].from : durationInFrames;
  const t = Math.min(1, Math.max(0, (frame - start) / Math.max(1, end - start)));
  const nextX = cur + 1 < chapters.length ? xs[cur + 1] : X1;
  const dotX = (xs[cur] ?? X0) + (nextX - (xs[cur] ?? X0)) * t;
  const enter = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  const text = (size: number, color: string, weight = 600, spacing = 4): React.CSSProperties => ({
    fontFamily: theme.font,
    fontSize: size,
    fontWeight: weight,
    letterSpacing: spacing,
    color,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: enter}}>
      {/* a soft dark band so the bar reads over any scene */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 300, background: 'linear-gradient(to bottom, rgba(6,8,12,0.92) 0%, rgba(6,8,12,0.72) 55%, rgba(6,8,12,0) 100%)'}} />
      {header ? (
        <>
          <div style={{position: 'absolute', left: X0, top: Y_TITLE - 16, display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 12, height: 12, borderRadius: 6, background: acc, boxShadow: `0 0 ${10 + 8 * pulse}px ${acc}`}} />
            <div style={text(25, 'rgba(255,255,255,0.78)')}>{header.title}</div>
          </div>
          {header.date ? <div style={{position: 'absolute', right: 1080 - X1, top: Y_TITLE - 16, ...text(25, 'rgba(255,255,255,0.62)')}}>{header.date}</div> : null}
        </>
      ) : null}
      <svg width={1080} height={260} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line x1={X0} y1={Y_LINE} x2={X1} y2={Y_LINE} stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
        <line x1={X0} y1={Y_LINE} x2={dotX} y2={Y_LINE} stroke={acc} strokeOpacity={0.55} strokeWidth={2.5} />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={Y_LINE} r={5} fill={i <= cur ? acc : 'rgba(255,255,255,0.32)'} />
        ))}
        <circle cx={dotX} cy={Y_LINE} r={15 + 3 * pulse} fill={acc} opacity={0.18} />
        <circle cx={dotX} cy={Y_LINE} r={9} fill={acc} />
      </svg>
      {chapters.map((c, i) => {
        const since = frame - c.from;
        const pop = i === cur ? interpolate(since, [0, 8], [1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
        const col = i === cur ? '#ffffff' : i < cur ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.36)';
        const first = i === 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: Y_LABEL - 14,
              left: first ? xs[i] - 2 : xs[i],
              transform: `translateX(${first ? 0 : -50}%) scale(${pop})`,
              transformOrigin: first ? 'left center' : 'center',
              ...text(21, col, i === cur ? 800 : 600, 3),
            }}
          >
            {c.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

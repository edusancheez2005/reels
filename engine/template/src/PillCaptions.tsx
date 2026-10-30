import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {KCaption} from './KineticCaptions';
import {PALETTES} from './lib/palette';
import {theme} from './lib/theme';

/**
 * Small caption pill near the bottom (the watcher.guru look): 1–4 words at a time in a dark pill, words appear as they're
 * spoken, emphasis words in the accent colour. Leaves the top of the frame to the chapter bar and the middle to the visual.
 * storyboard: "captionStyle": "pill" (optional "captionY", default 1330 = above Instagram's caption/UI area).
 */
type Tok = {text: string; from: number; to: number; emph: boolean};
type Page = {start: number; end: number; toks: Tok[]};

const MAX_WORDS = 4;
const MAX_MS = 1600;
const MAX_CHARS = 24; // one line at 54 px inside the pill

const paginate = (caps: KCaption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  caps.forEach((c, i) => {
    const prev = caps[i - 1]?.text.trim() ?? '';
    const sentenceEnd = /[.?!:;]["')\]]?$/.test(prev);
    const clauseEnd = /[,—–]$/.test(prev);
    const chars = cur ? cur.toks.reduce((n, t) => n + t.text.length + 1, 0) + c.text.trim().length : 0;
    const full = cur && (cur.toks.length >= MAX_WORDS || c.endMs - cur.start > MAX_MS || chars > MAX_CHARS);
    if (!cur || sentenceEnd || full || (clauseEnd && cur.toks.length >= 2)) {
      cur = {start: c.startMs, end: c.endMs, toks: []};
      pages.push(cur);
    }
    cur.toks.push({text: c.text.trim(), from: c.startMs, to: c.endMs, emph: !!c.emph});
    cur.end = c.endMs;
  });
  return pages;
};

export const PillCaptions: React.FC<{captions: KCaption[]; y?: number}> = ({captions, y = 1330}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => paginate(captions), [captions]);
  const k = pages.findIndex((p, i) => ms >= p.start - 60 && (i + 1 >= pages.length || ms < pages[i + 1].start - 60));
  if (k < 0) return null;
  const page = pages[k];
  const since = ms - (page.start - 60);
  const pin = interpolate(since, [0, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const acc = PALETTES.dark.accent;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            transform: `translateY(-50%) scale(${0.94 + 0.06 * pin})`,
            opacity: pin,
            background: 'rgba(18,20,24,0.9)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18,
            padding: '12px 28px 14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            maxWidth: 900,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {page.toks.map((t, i) => {
            const on = ms >= t.from - 40;
            const p = interpolate(ms, [t.from - 40, t.from + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <span
                key={i}
                style={{
                  fontFamily: theme.font,
                  fontSize: 54,
                  fontWeight: 750,
                  letterSpacing: -0.5,
                  color: t.emph ? acc : '#ffffff',
                  opacity: on ? 0.4 + 0.6 * p : 0.32,
                  textShadow: t.emph ? `0 0 18px ${acc}55` : 'none',
                }}
              >
                {t.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Caption} from '@remotion/captions';
import {theme} from './lib/theme';

/** A page closes when it would exceed this span, this many words, or at sentence/clause punctuation. */
const MAX_PAGE_MS = 1100;
const MAX_WORDS = 3;

type Token = {text: string; fromMs: number; toMs: number};
type Page = {startMs: number; endMs: number; tokens: Token[]};

/** Group words into short caption pages that never straddle a sentence break. */
export const paginate = (captions: Caption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  captions.forEach((c, i) => {
    const prev = captions[i - 1]?.text.trim() ?? '';
    const sentenceEnd = /[.?!:;]["')\]]?$/.test(prev);
    const clauseEnd = /[,—–-]$/.test(prev);
    const full = cur && (cur.tokens.length >= MAX_WORDS || c.endMs - cur.startMs > MAX_PAGE_MS);
    if (!cur || sentenceEnd || full || (clauseEnd && cur.tokens.length >= 2)) {
      cur = {startMs: c.startMs, endMs: c.endMs, tokens: []};
      pages.push(cur);
    }
    cur.tokens.push({text: c.text.trim(), fromMs: c.startMs, toMs: c.endMs});
    cur.endMs = c.endMs;
  });
  return pages;
};

const PageView: React.FC<{page: Page}> = ({page}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const enter = spring({frame, fps, durationInFrames: 6, config: {damping: 16, stiffness: 220}});

  // the active word is the last one that has started (stays lit through short pauses)
  let active = -1;
  page.tokens.forEach((t, i) => {
    if (t.fromMs <= nowMs) active = i;
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: theme.captionY,
        left: 70,
        right: 110,
        transform: `translateY(-50%) scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
        opacity: enter,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: theme.captionSize * 0.34,
        fontFamily: theme.font,
        fontWeight: 800,
        fontSize: theme.captionSize,
        lineHeight: 1.1,
        letterSpacing: -1,
        color: theme.text,
        textShadow: '0 4px 18px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {page.tokens.map((t, i) => {
        const on = i === active;
        const startF = Math.round(((t.fromMs - page.startMs) / 1000) * fps);
        const pop = on ? spring({frame: frame - startF, fps, durationInFrames: 6}) : 0;
        return (
          <span key={i} style={{display: 'inline-block', color: on ? theme.accent : theme.text, transform: `scale(${1 + 0.08 * pop})`}}>
            {t.text}
          </span>
        );
      })}
    </div>
  );
};

export const Captions: React.FC<{captions: Caption[]}> = ({captions}) => {
  const {fps} = useVideoConfig();
  const pages = useMemo(() => paginate(captions), [captions]);
  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? next.startMs : page.endMs + 500;
        const dur = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <PageView page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

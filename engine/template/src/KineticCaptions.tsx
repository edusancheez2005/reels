import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Caption} from '@remotion/captions';
import {PALETTES, rgba} from './lib/palette';
import {theme} from './lib/theme';

/**
 * In-frame kinetic captions (the look in the reference reels):
 * a short phrase sits above the visual; words appear as they're spoken, earlier words dim,
 * the current word is bright, and emphasis words get a Figma-style selection box.
 */
export type KCaption = Caption & {emph?: boolean};
type Token = {text: string; fromMs: number; toMs: number; emph: boolean};
type Page = {startMs: number; endMs: number; tokens: Token[]};

const MAX_WORDS = 5;
const MAX_PAGE_MS = 1900;
const TOP = 250; // vertical centre of the caption block
const SIZE = 74;
const SELECT = '#3D86FF';

export const paginateK = (captions: KCaption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  captions.forEach((c, i) => {
    const prev = captions[i - 1]?.text.trim() ?? '';
    const sentenceEnd = /[.?!:;]["')\]]?$/.test(prev);
    const clauseEnd = /[,—–]$/.test(prev);
    const full = cur && (cur.tokens.length >= MAX_WORDS || c.endMs - cur.startMs > MAX_PAGE_MS);
    if (!cur || sentenceEnd || full || (clauseEnd && cur.tokens.length >= 3)) {
      cur = {startMs: c.startMs, endMs: c.endMs, tokens: []};
      pages.push(cur);
    }
    cur.tokens.push({text: c.text.trim(), fromMs: c.startMs, toMs: c.endMs, emph: !!c.emph});
    cur.endMs = c.endMs;
  });
  return pages;
};

const SelectBox: React.FC<{p: number; color: string}> = ({p, color}) => {
  const dot = (pos: React.CSSProperties) => (
    <div style={{position: 'absolute', width: 13, height: 13, borderRadius: 7, background: '#fff', border: `3px solid ${SELECT}`, boxSizing: 'border-box', ...pos}} />
  );
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-2px -12px',
        border: `3px solid ${SELECT}`,
        borderRadius: 4,
        background: rgba(SELECT, color === '#fff' ? 0.16 : 0.1),
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [1.12, 1])})`,
      }}
    >
      {dot({left: -8, top: -8})}
      {dot({right: -8, bottom: -8})}
    </div>
  );
};

const PageView: React.FC<{page: Page; dark: boolean}> = ({page, dark}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const pal = dark ? PALETTES.dark : PALETTES.light;
  const past = dark ? '#7C8190' : '#A2A2AA';

  let active = -1;
  page.tokens.forEach((t, i) => {
    if (t.fromMs - 40 <= nowMs) active = i;
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: TOP,
        left: 70,
        right: 70,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'baseline',
        columnGap: SIZE * 0.27,
        rowGap: SIZE * 0.14,
        fontFamily: theme.font,
        fontSize: SIZE,
        lineHeight: 1.12,
        letterSpacing: -1.5,
      }}
    >
      {(() => {
        // group consecutive emphasis words so a phrase shares one selection box
        const groups: {emph: boolean; idx: number[]}[] = [];
        page.tokens.forEach((t, i) => {
          const g = groups[groups.length - 1];
          if (g && g.emph && t.emph) g.idx.push(i);
          else groups.push({emph: t.emph, idx: [i]});
        });
        const word = (i: number) => {
          const t = page.tokens[i];
          const startF = Math.round(((t.fromMs - 40 - page.startMs) / 1000) * fps);
          const appear = spring({frame: frame - startF, fps, durationInFrames: 6, config: {damping: 18, stiffness: 240}});
          const bright = i === active || t.emph;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: bright ? pal.text : past,
                fontWeight: bright ? 650 : 450,
                opacity: frame < startF ? 0 : appear,
                transform: `translateY(${(1 - appear) * 12}px)`,
              }}
            >
              {t.text}
            </span>
          );
        };
        return groups.map((g, gi) => {
          if (!g.emph) return g.idx.map(word);
          const first = page.tokens[g.idx[0]];
          const startF = Math.round(((first.fromMs - 40 - page.startMs) / 1000) * fps);
          const bp = frame < startF ? 0 : spring({frame: frame - startF, fps, durationInFrames: 6, config: {damping: 18, stiffness: 240}});
          // the box wraps only the words already spoken, so it grows word by word
          const said = g.idx.filter((i) => frame >= Math.round(((page.tokens[i].fromMs - 40 - page.startMs) / 1000) * fps));
          const rest = g.idx.filter((i) => !said.includes(i));
          return (
            <span key={`g${gi}`} style={{display: 'inline-flex', columnGap: SIZE * 0.27, flexWrap: 'nowrap'}}>
              {said.length ? (
                <span style={{position: 'relative', display: 'inline-flex', columnGap: SIZE * 0.27}}>
                  <SelectBox p={bp} color={dark ? '#fff' : '#000'} />
                  {said.map(word)}
                </span>
              ) : null}
              {rest.map(word)}
            </span>
          );
        });
      })()}
    </div>
  );
};

/** Caption ink follows the scene on screen in each frame, so a page that crosses a light/dark cut stays readable. */
const ThemedPage: React.FC<{page: Page; fromFrame: number; themeAt: (ms: number) => string}> = ({page, fromFrame, themeAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = ((fromFrame + frame) / fps) * 1000;
  return <PageView page={page} dark={themeAt(ms) !== 'light'} />;
};

export const KineticCaptions: React.FC<{captions: KCaption[]; themeAt: (ms: number) => string}> = ({captions, themeAt}) => {
  const {fps} = useVideoConfig();
  const pages = useMemo(() => paginateK(captions), [captions]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round(((page.startMs - 40) / 1000) * fps);
        const endMs = next ? next.startMs - 40 : page.endMs + 600;
        const dur = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={Math.max(0, from)} durationInFrames={dur} layout="none">
            <ThemedPage page={page} fromFrame={Math.max(0, from)} themeAt={themeAt} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

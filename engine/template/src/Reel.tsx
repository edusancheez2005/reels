import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {KineticCaptions, type KCaption} from './KineticCaptions';
import {Captions} from './Captions';
import {PALETTES, PaletteProvider} from './lib/palette';
import {theme} from './lib/theme';
import {SceneShell, type TransitionKind} from './Shell';
import {SCENES} from './scenes';

export type TimelineScene = {
  id: string;
  component: string;
  props: Record<string, unknown>;
  from: number;
  durationInFrames: number;
  beats: number[];
  theme?: 'dark' | 'light';
  transition?: TransitionKind;
  anchorText?: string;
};

export type Timeline = {
  slug: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  audio: string | null;
  captionStyle?: 'kinetic' | 'band' | 'none';
  captions: KCaption[];
  scenes: TimelineScene[];
};

const Missing: React.FC<{name: string}> = ({name}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', color: '#FF5C5C', fontSize: 48, fontFamily: theme.font}}>
    Unknown component "{name}"
  </AbsoluteFill>
);

export const Reel: React.FC<{timeline: Timeline}> = ({timeline}) => {
  const scenes = timeline.scenes;
  const themeAt = (ms: number) => {
    const f = (ms / 1000) * timeline.fps;
    let t = scenes[0]?.theme ?? 'dark';
    for (const s of scenes) if (s.from <= f) t = s.theme ?? 'dark';
    return t;
  };
  const style = timeline.captionStyle ?? 'kinetic';
  return (
    <AbsoluteFill style={{backgroundColor: PALETTES[scenes[0]?.theme === 'light' ? 'light' : 'dark'].bg}}>
      {scenes.map((s, k) => {
        const C = SCENES[s.component];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={`${s.component} · ${s.anchorText ?? s.id}`}>
            <PaletteProvider name={s.theme}>
              <SceneShell kind={k === 0 ? 'cut' : s.transition ?? 'pop'} exit={scenes[k + 1]?.transition} durationInFrames={s.durationInFrames}>
                {C ? <C props={s.props} beats={s.beats} durationInFrames={s.durationInFrames} /> : <Missing name={s.component} />}
              </SceneShell>
            </PaletteProvider>
          </Sequence>
        );
      })}
      {style === 'kinetic' ? <KineticCaptions captions={timeline.captions} themeAt={themeAt} /> : null}
      {style === 'band' ? <Captions captions={timeline.captions} /> : null}
      {timeline.audio ? <Audio src={staticFile(timeline.audio)} /> : null}
    </AbsoluteFill>
  );
};

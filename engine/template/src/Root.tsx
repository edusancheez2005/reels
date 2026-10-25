import React from 'react';
import {Composition} from 'remotion';
import {Reel, type Timeline} from './Reel';
import timelineJson from './timeline.json';

// build_timeline.py overwrites src/timeline.json for each episode.
const timeline = timelineJson as unknown as Timeline;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={Math.max(1, timeline.durationInFrames)}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
    defaultProps={{timeline}}
  />
);

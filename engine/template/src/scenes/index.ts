import type React from 'react';
import type {SceneProps} from '../lib/anim';
import {Title} from './Title';
import {Stat} from './Stat';
import {Steps} from './Steps';
import {Compare} from './Compare';
import {Terminal} from './Terminal';
import {Window} from './Window';
import {Diagram} from './Diagram';
import {Chart} from './Chart';
import {ImagePanel} from './ImagePanel';
import {ParticleShape} from './ParticleShape';
import {BigNumber} from './BigNumber';
import {Shot} from './Shot';
import {Ruler} from './Ruler';
import {Growth} from './Growth';
import {TxWall} from './TxWall';
import {Mempool} from './Mempool';
import {Phone} from './Phone';
import {Flow} from './Flow';
import {Checklist} from './Checklist';
import {PriceLine} from './PriceLine';
import {RouteMap} from './RouteMap';
import {SeaScene, Scale, Quote, Souvenir} from './Story';
import {ColdChain, Filleting, PinBones} from './FishCraft';

// Register new components here. Storyboard "component" names map to these keys.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<string, React.FC<SceneProps<any>>> = {
  // v2 — illustration-led, theme-aware
  ParticleShape,
  BigNumber,
  Shot,
  Ruler,
  Growth,
  TxWall,
  Mempool,
  Phone,
  Flow,
  Checklist,
  PriceLine,
  Title,
  RouteMap,
  SeaScene,
  ColdChain,
  Filleting,
  PinBones,
  Scale,
  Quote,
  Souvenir,
  // v1 — cards (dark)
  Stat,
  Steps,
  Compare,
  Terminal,
  Window,
  Diagram,
  Chart,
  Image: ImagePanel,
};

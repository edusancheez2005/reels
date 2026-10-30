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
import {BatteryCell} from './BatteryCell';
import {Phone3D} from '../three/Phone3D';
import {Cell3D} from '../three/Cell3D';
import {Hair3D, Swarm3D} from '../three/More3D';
import {Pool3D} from '../three/Pool3D';
import {Coin3D} from '../three/Coin3D';
import {Vault3D, Drive3D} from '../three/Vault3D';
import {Landfill3D} from '../three/Landfill3D';
import {Laptop3D, HardDrive3D} from '../three/Desk3D';
import {Character3D} from '../three/Character3D';
import {Drives3D} from '../three/Drives3D';
import {Seed3D, Letter3D} from '../three/Wallet3D';

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
  BatteryCell,
  Phone3D,
  Cell3D,
  Hair3D,
  Vault3D,
  Drive3D,
  Landfill3D,
  Laptop3D,
  HardDrive3D,
  Swarm3D,
  Pool3D,
  Coin3D,
  Character3D,
  Drives3D,
  Seed3D,
  Letter3D,
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

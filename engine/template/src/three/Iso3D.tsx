import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Environment, Lightformer} from '@react-three/drei';
import {EffectComposer, Bloom, Vignette, Noise} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {LEAD_FRAMES, revealFrame} from '../lib/anim';
import {theme} from '../lib/theme';
import {useClock, canvasTex, rand, Tags, type Tag} from './kit';
import {Key} from './Landfill3D';

/**
 * Iso3D — one clean isometric "world" for breakdown reels (Edu, 30 Oct 2026, after watcher.guru's "How Binance got hacked"):
 * a dark slab with a few labelled objects (servers, screens, documents, a key, a vault, a laptop, coins, people as pawns),
 * glowing links between them, things that travel along paths, and sentence-case label pills with leader lines.
 * Orthographic camera that glides between parts of the same world, so consecutive Iso3D scenes read as one shot.
 *
 * props:
 *   world   {w, d} slab size in world units (default 12 × 7)
 *   objects [{id, kind, at: [x, z], size?, tone?, icon?, text?, rot?}]
 *           kind: server | block | doc | key | vault | laptop | coins | pawn | pad | wall
 *           tone: alert (red) | good (green) | accent | ice | muted (default neutral grey)
 *           icon (block screens): check | key | warn | lock | cross | coin | eye | sign | bolt | clock | puzzle (or up to 3 letters)
 *   hidden  [ids] start invisible (appear on show:<id>)
 *   links   [{id, from, to, style: dashed | beam, tone}]   from/to = object id or [x, z]
 *   movers  [{id, kind: doc | coin | packet, path: [id | [x, z], …], tone?, text?, dur? (frames per leg)}]
 *   labels  [{text, at: id | [x, y, z], side?: left | right | up, dx?, dy?, tone?}]  shown by label:<n>
 *   state   {alert: [ids], good: [ids], frozen: [ids], links: [ids], moved: [ids], off: [ids]}  (carry-over from an earlier scene)
 *   tags    big 2D overlay tags (kit Tag, 1080×1920 px), shown by tag:<n> (e.g. the hook number on beat 0)
 *   cam     [{beat, target: [x, y, z], zoom, dur}]  (beat -1 = opening shot; zoom = pixels per world unit, ~70)
 *   actions per beat: show:<id> hide:<id> alert:<id> good:<id> freeze:<id> off:<id> (switched off: lights out, body dark) pulse:<id> link:<id> move:<id> label:<n> tag:<n> cam
 */
type Pt2 = [number, number];
type Obj = {id: string; kind: string; at: Pt2; size?: number; tone?: string; icon?: string; text?: string; rot?: number};
type Link = {id: string; from: string | Pt2; to: string | Pt2; style?: 'dashed' | 'beam'; tone?: string};
type Mover = {id: string; kind?: string; path: (string | Pt2)[]; tone?: string; text?: string; dur?: number};
type Label = {text: string; at: string | [number, number, number]; side?: 'left' | 'right' | 'up'; dx?: number; dy?: number; tone?: string};
type IsoCam = {beat: number; target?: [number, number, number]; zoom?: number; dur?: number};
type P = {
  actions?: string[];
  world?: {w?: number; d?: number};
  objects?: Obj[];
  hidden?: string[];
  links?: Link[];
  movers?: Mover[];
  labels?: Label[];
  state?: {alert?: string[]; good?: string[]; frozen?: string[]; links?: string[]; moved?: string[]; off?: string[]};
  tags?: Tag[];
  cam?: IsoCam[];
  caption?: string;
};

const W = 1080;
const H = 1920;
const SHIFT = 170; // world centre sits ~170 px above frame centre: between the chapter bar and the caption pill
const DIR = new THREE.Vector3(1, 0.86, 1).normalize();
const TONE: Record<string, string> = {alert: '#ff4f45', good: '#3ddc84', accent: '#3bc9ee', ice: '#9fdcff', warm: '#ffb547', muted: '#8a90a0'};
const BODY: Record<string, string> = {alert: '#8e3a31', good: '#1f4a35', accent: '#1d4150', ice: '#2b4555', warm: '#5a4320', muted: '#2a2d33'};
const NEUTRAL = '#2a2d33';

const heightOf = (o: Obj) => {
  const s = o.size ?? 1;
  switch (o.kind) {
    case 'server': return 1.35 * s;
    case 'block': return 1.0 * s;
    case 'vault': return 1.45 * s;
    case 'doc': return 0.75 * s;
    case 'key': return 1.2 * s;
    case 'laptop': return 0.7 * s;
    case 'coins': return 0.45 * s;
    case 'pawn': return 1.2 * s;
    case 'wall': return 1.1 * s;
    default: return 0.1;
  }
};

/** Screen position (px, 1080 × 1920) of a world point for the current orthographic camera. */
const project = (target: THREE.Vector3, zoom: number, v: THREE.Vector3): [number, number] => {
  const c = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 400);
  c.position.copy(target.clone().add(DIR.clone().multiplyScalar(60)));
  c.up.set(0, 1, 0);
  c.lookAt(target);
  c.zoom = zoom;
  c.setViewOffset(W, H, 0, SHIFT, W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const p = v.clone().project(c);
  return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
};

const OrthoRig: React.FC<{target: THREE.Vector3; zoom: number}> = ({target, zoom}) => {
  const {camera} = useThree();
  const c = camera as THREE.OrthographicCamera;
  c.left = -W / 2;
  c.right = W / 2;
  c.top = H / 2;
  c.bottom = -H / 2;
  c.near = 0.1;
  c.far = 400;
  c.position.copy(target.clone().add(DIR.clone().multiplyScalar(60)));
  c.up.set(0, 1, 0);
  c.lookAt(target);
  c.zoom = zoom;
  c.setViewOffset(W, H, 0, SHIFT, W, H);
  c.updateProjectionMatrix();
  return null;
};

// ---------- textures ----------
const iconTex = (icon: string, color: string) =>
  canvasTex(256, 200, (g) => {
    g.fillStyle = '#0d1014';
    g.fillRect(0, 0, 256, 200);
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.shadowColor = color;
    g.shadowBlur = 18;
    const cx = 128;
    const cy = 100;
    g.beginPath();
    if (icon === 'check') {
      g.moveTo(cx - 44, cy + 2);
      g.lineTo(cx - 12, cy + 32);
      g.lineTo(cx + 48, cy - 34);
      g.stroke();
    } else if (icon === 'cross') {
      g.moveTo(cx - 36, cy - 36);
      g.lineTo(cx + 36, cy + 36);
      g.moveTo(cx + 36, cy - 36);
      g.lineTo(cx - 36, cy + 36);
      g.stroke();
    } else if (icon === 'warn') {
      g.moveTo(cx, cy - 52);
      g.lineTo(cx + 56, cy + 44);
      g.lineTo(cx - 56, cy + 44);
      g.closePath();
      g.stroke();
      g.fillRect(cx - 6, cy - 18, 12, 34);
      g.fillRect(cx - 6, cy + 24, 12, 10);
    } else if (icon === 'lock') {
      g.strokeRect(cx - 40, cy - 6, 80, 58);
      g.beginPath();
      g.arc(cx, cy - 6, 28, Math.PI, 0);
      g.stroke();
    } else if (icon === 'key') {
      g.arc(cx - 34, cy, 22, 0, Math.PI * 2);
      g.moveTo(cx - 12, cy);
      g.lineTo(cx + 56, cy);
      g.moveTo(cx + 40, cy);
      g.lineTo(cx + 40, cy + 20);
      g.moveTo(cx + 54, cy);
      g.lineTo(cx + 54, cy + 14);
      g.stroke();
    } else if (icon === 'coin') {
      g.arc(cx, cy, 44, 0, Math.PI * 2);
      g.stroke();
      g.font = 'bold 56px Inter, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('$', cx, cy + 2);
    } else if (icon === 'eye') {
      g.ellipse(cx, cy, 56, 30, 0, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(cx, cy, 13, 0, Math.PI * 2);
      g.fill();
    } else if (icon === 'bolt') {
      g.moveTo(cx + 14, cy - 60);
      g.lineTo(cx - 30, cy + 8);
      g.lineTo(cx + 4, cy + 8);
      g.lineTo(cx - 14, cy + 60);
      g.lineTo(cx + 34, cy - 10);
      g.lineTo(cx + 2, cy - 10);
      g.closePath();
      g.fill();
    } else if (icon === 'clock') {
      g.arc(cx, cy, 50, 0, Math.PI * 2);
      g.moveTo(cx, cy);
      g.lineTo(cx, cy - 34);
      g.moveTo(cx, cy);
      g.lineTo(cx + 26, cy + 10);
      g.stroke();
    } else if (icon === 'puzzle') {
      g.lineWidth = 6;
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
          const x = cx - 60 + c * 30;
          const y = cy - 60 + r * 30;
          if ((r * 5 + c * 3) % 4 === 0) g.fillRect(x + 3, y + 3, 24, 24);
          else g.strokeRect(x + 3, y + 3, 24, 24);
        }
    } else if (icon === 'sign') {
      g.moveTo(cx - 60, cy + 20);
      g.bezierCurveTo(cx - 30, cy - 40, cx - 10, cy + 40, cx + 10, cy - 10);
      g.bezierCurveTo(cx + 25, cy - 40, cx + 40, cy + 30, cx + 60, cy);
      g.stroke();
    } else {
      g.font = 'bold 64px Inter, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(icon.slice(0, 3).toUpperCase(), cx, cy + 4);
    }
  });

const docTex = (text: string, color: string) =>
  canvasTex(320, 220, (g) => {
    g.fillStyle = '#f2ebe8';
    g.fillRect(0, 0, 320, 220);
    g.fillStyle = '#c9c2bf';
    [40, 70, 100].forEach((y, i) => g.fillRect(28, y, 264 - i * 50, 12));
    if (text) {
      g.font = 'bold 34px Inter, sans-serif';
      g.fillStyle = color;
      g.textBaseline = 'middle';
      g.fillText(text.toUpperCase(), 28, 168);
      g.beginPath();
      g.arc(276, 166, 22, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(265, 166);
      g.lineTo(273, 175);
      g.lineTo(288, 157);
      g.stroke();
    }
  });

const slotsTex = (led: string) =>
  canvasTex(256, 360, (g) => {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.clearRect(0, 0, 256, 360);
    for (let i = 0; i < 7; i++) {
      const y = 40 + i * 44;
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(26, y, 204, 14);
      g.fillStyle = 'rgba(255,255,255,0.10)';
      g.fillRect(26, y + 14, 204, 3);
      g.fillStyle = led;
      g.beginPath();
      g.arc(214, y + 7, 5, 0, Math.PI * 2);
      g.fill();
    }
  });

// ---------- objects ----------
const IsoThing: React.FC<{o: Obj; vis: number; alert: number; good: number; frozen: number; pulse: number; frame: number; off?: number}> = ({o, vis, alert, good, frozen, pulse, frame, off = 0}) => {
  const s = o.size ?? 1;
  const tone = o.tone ?? '';
  const baseCol = BODY[tone] ?? NEUTRAL;
  const body = useMemo(() => new THREE.MeshStandardMaterial({color: baseCol, roughness: 0.62, metalness: 0.15}), [baseCol]);
  const col = new THREE.Color(baseCol).lerp(new THREE.Color(BODY.alert), alert).lerp(new THREE.Color(BODY.good), good).lerp(new THREE.Color('#5b7d93'), frozen);
  col.lerp(new THREE.Color('#121316'), off * 0.8);
  body.color.copy(col);
  body.emissive = new THREE.Color(alert > 0 ? TONE.alert : good > 0 ? TONE.good : frozen > 0 ? TONE.ice : '#000000');
  body.emissiveIntensity = 0.12 * Math.max(alert, good, frozen) * (0.7 + 0.3 * Math.sin(frame / 5));
  const lightCol = alert > 0.5 ? TONE.alert : good > 0.5 ? TONE.good : TONE[tone] ?? '#cfd6e0';
  const screen = useMemo(() => {
    const t = o.kind === 'block' ? iconTex(o.icon ?? 'check', o.icon === 'cross' || o.icon === 'warn' ? TONE.alert : TONE[tone] ?? TONE.good) : null;
    return new THREE.MeshStandardMaterial({map: t ?? undefined, emissiveMap: t ?? undefined, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.9, roughness: 0.4});
  }, [o.kind, o.icon, tone]);
  const doc = useMemo(() => {
    const t = o.kind === 'doc' ? docTex(o.text ?? '', TONE[tone] ?? '#2e9e5b') : null;
    return new THREE.MeshStandardMaterial({map: t ?? undefined, roughness: 0.7});
  }, [o.kind, o.text, tone]);
  const slots = useMemo(() => {
    const t = o.kind === 'server' ? slotsTex(tone === 'alert' ? '#ff6a5c' : '#5fe39b') : null;
    return new THREE.MeshBasicMaterial({map: t ?? undefined, transparent: true, depthWrite: false});
  }, [o.kind, tone]);
  const glow = useMemo(() => new THREE.MeshStandardMaterial({color: TONE.good, emissive: new THREE.Color(TONE.good), emissiveIntensity: 2.2, toneMapped: false}), []);
  glow.color.set(lightCol);
  glow.emissive.set(lightCol);
  glow.emissiveIntensity = 2.2 * (1 - off);
  slots.opacity = 1 - 0.85 * off;
  screen.emissiveIntensity = 0.9 * (1 - 0.85 * off);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({color: '#e2a93b', metalness: 0.85, roughness: 0.3}), []);
  const iceMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#bfe7ff', transparent: true, opacity: 0, roughness: 0.1, metalness: 0, depthWrite: false}), []);
  iceMat.opacity = 0.32 * frozen;

  const hgt = heightOf(o);
  // geometries are built once per object (a new geometry every frame would leak GPU memory over a long render)
  const geoCache = useMemo(() => new Map<string, THREE.BufferGeometry>(), []);
  const geo = (w: number, h: number, d: number, r = 0.05) => {
    const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r}`;
    let g = geoCache.get(k);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 3, r);
      geoCache.set(k, g);
    }
    return g;
  };
  const padMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.12, depthWrite: false}), []);
  padMat.color.set(lightCol);
  if (vis <= 0.001) return null;
  const rise = (1 - vis) * -0.6;
  const sc = (0.9 + 0.1 * vis) * (1 + 0.06 * pulse);

  let inner: React.ReactNode = null;
  if (o.kind === 'server') {
    inner = (
      <>
        <mesh material={body} position={[0, hgt / 2, 0]} geometry={geo(0.95 * s, hgt, 0.95 * s)} />
        <mesh material={slots} position={[0, hgt / 2, 0.476 * s]}>
          <planeGeometry args={[0.8 * s, hgt * 0.9]} />
        </mesh>
      </>
    );
  } else if (o.kind === 'block') {
    inner = (
      <>
        <mesh material={body} position={[0, hgt / 2, 0]} geometry={geo(s, hgt, s)} />
        <mesh material={screen} position={[0.501 * s, hgt * 0.52, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.62 * s, 0.48 * s]} />
        </mesh>
      </>
    );
  } else if (o.kind === 'vault') {
    inner = (
      <>
        <mesh material={body} position={[0, hgt / 2, 0]} geometry={geo(1.45 * s, hgt, 1.45 * s, 0.08)} />
        <group position={[0.73 * s, hgt / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={body}>
            <cylinderGeometry args={[0.5 * s, 0.5 * s, 0.06, 48]} />
          </mesh>
          <mesh material={glow} position={[0, 0.04, 0]}>
            <torusGeometry args={[0.36 * s, 0.025 * s, 12, 48]} />
          </mesh>
        </group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} material={gold} position={[0.79 * s, hgt / 2, 0]} rotation={[(i * Math.PI) / 3, 0, 0]}>
            <boxGeometry args={[0.04, 0.5 * s, 0.05]} />
          </mesh>
        ))}
      </>
    );
  } else if (o.kind === 'doc') {
    inner = (
      <group rotation={[0, Math.PI / 4, 0]}>
        <mesh material={doc} position={[0, 0.45 * s, 0]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.95 * s, 0.62 * s, 0.035]} />
        </mesh>
      </group>
    );
  } else if (o.kind === 'key') {
    const bob = Math.sin(frame / 12) * 0.06;
    inner = (
      <group position={[0, 0.85 * s + bob, 0]} rotation={[0, Math.PI / 4 + Math.sin(frame / 30) * 0.25, 0]} scale={0.9 * s}>
        <group position={[-0.5, 0, 0]}>
          <Key mat={glow} />
        </group>
      </group>
    );
  } else if (o.kind === 'laptop') {
    inner = (
      <group rotation={[0, Math.PI / 4, 0]}>
        <mesh material={body} position={[0, 0.03, 0]} geometry={geo(1.0 * s, 0.05, 0.7 * s, 0.02)} />
        <group position={[0, 0.05, -0.33 * s]} rotation={[-0.25, 0, 0]}>
          <mesh material={body} position={[0, 0.32 * s, 0]} geometry={geo(1.0 * s, 0.64 * s, 0.035, 0.015)} />
          <mesh material={glow} position={[0, 0.32 * s, 0.02]}>
            <planeGeometry args={[0.9 * s, 0.54 * s]} />
          </mesh>
        </group>
      </group>
    );
  } else if (o.kind === 'coins') {
    inner = (
      <>
        {Array.from({length: 6}).map((_, i) => (
          <mesh key={i} material={gold} position={[(rand(i + 3) - 0.5) * 0.05, 0.04 + i * 0.07 * s, (rand(i + 9) - 0.5) * 0.05]}>
            <cylinderGeometry args={[0.32 * s, 0.32 * s, 0.06 * s, 40]} />
          </mesh>
        ))}
      </>
    );
  } else if (o.kind === 'pawn') {
    inner = (
      <>
        <mesh material={body} position={[0, 0.42 * s, 0]}>
          <cylinderGeometry args={[0.2 * s, 0.32 * s, 0.84 * s, 32]} />
        </mesh>
        <mesh material={body} position={[0, 1.0 * s, 0]}>
          <sphereGeometry args={[0.22 * s, 32, 24]} />
        </mesh>
      </>
    );
  } else if (o.kind === 'wall') {
    inner = (
      <mesh material={body} position={[0, hgt / 2, 0]} geometry={geo(0.12, hgt, 2.4 * s, 0.03)} />
    );
  } else if (o.kind === 'pad') {
    inner = (
      <mesh material={padMat} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4 * s, 1.6 * s]} />
      </mesh>
    );
  }
  return (
    <group position={[o.at[0], rise, o.at[1]]} rotation={[0, o.rot ?? 0, 0]} scale={sc}>
      {inner}
      {frozen > 0 && o.kind !== 'pad' ? (
        <mesh material={iceMat} position={[0, hgt / 2, 0]}>
          <boxGeometry args={[1.25 * s, hgt + 0.15, 1.25 * s]} />
        </mesh>
      ) : null}
      {/* soft contact shadow */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75 * s, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28 * vis} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ---------- links ----------
const IsoLink: React.FC<{a: THREE.Vector3; b: THREE.Vector3; style: string; color: string; p: number; frame: number}> = ({a, b, style, color, p, frame}) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color, emissive: new THREE.Color(color), emissiveIntensity: style === 'beam' ? 2.4 : 0.6, toneMapped: style !== 'beam', transparent: true, opacity: style === 'beam' ? 1 : 0.55}), [color, style]);
  if (p <= 0) return null;
  const len = a.distanceTo(b);
  const dir = b.clone().sub(a).normalize();
  const ang = Math.atan2(dir.x, dir.z);
  if (style === 'beam') {
    const shown = len * p;
    const mid = a.clone().add(dir.clone().multiplyScalar(shown / 2));
    const pulses = 4;
    return (
      <group>
        <mesh material={mat} position={[mid.x, 0.03, mid.z]} rotation={[0, ang, 0]}>
          <boxGeometry args={[0.05, 0.03, shown]} />
        </mesh>
        {p >= 1
          ? Array.from({length: pulses}).map((_, i) => {
              const t = ((frame / 40 + i / pulses) % 1) * len;
              const q = a.clone().add(dir.clone().multiplyScalar(t));
              return (
                <mesh key={i} material={mat} position={[q.x, 0.05, q.z]}>
                  <sphereGeometry args={[0.06, 12, 8]} />
                </mesh>
              );
            })
          : null}
      </group>
    );
  }
  const n = Math.max(2, Math.floor(len / 0.28));
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        if (i / n > p) return null;
        const q = a.clone().add(dir.clone().multiplyScalar((i + 0.5) * (len / n)));
        return (
          <mesh key={i} material={mat} position={[q.x, 0.02, q.z]} rotation={[0, ang, 0]}>
            <boxGeometry args={[0.035, 0.012, 0.12]} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------- the scene ----------
export const Iso3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has} = useClock(beats, acts);
  const objs = props.objects ?? [];
  const byId = useMemo(() => Object.fromEntries(objs.map((o) => [o.id, o])), [objs]);
  const world = {w: props.world?.w ?? 12, d: props.world?.d ?? 7};
  const st = props.state ?? {};

  // camera
  const cams = (props.cam && props.cam.length ? props.cam : [{beat: -1, target: [0, 0, 0] as [number, number, number], zoom: 68}]).map((c) => ({
    ...c,
    f: c.beat < 0 ? -999 : revealFrame(beats, c.beat) - LEAD_FRAMES,
  }));
  const target = new THREE.Vector3(...(cams[0].target ?? [0, 0, 0]));
  let zoom = cams[0].zoom ?? 68;
  for (let k = 1; k < cams.length; k++) {
    const c = cams[k];
    const t = interpolate(frame, [c.f, c.f + (c.dur ?? 26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    target.lerp(new THREE.Vector3(...(c.target ?? target.toArray())), t);
    zoom += ((c.zoom ?? zoom) - zoom) * t;
  }
  zoom *= interpolate(frame, [0, durationInFrames], [1, 1.035]); // slow push keeps it alive

  const pt = (ref: string | Pt2, y = 0): THREE.Vector3 => {
    if (typeof ref === 'string') {
      const o = byId[ref];
      return o ? new THREE.Vector3(o.at[0], y, o.at[1]) : new THREE.Vector3();
    }
    return new THREE.Vector3(ref[0], y, ref[1]);
  };
  const visOf = (id: string) => {
    if (has(`hide:${id}`) && since(`hide:${id}`) >= 0) return 1 - p(`hide:${id}`, 10);
    if ((props.hidden ?? []).includes(id)) return has(`show:${id}`) ? p(`show:${id}`, 14, Easing.out(Easing.back(1.3))) : 0;
    return 1;
  };
  const flag = (name: string, id: string, list?: string[]) => ((list ?? []).includes(id) ? 1 : has(`${name}:${id}`) ? p(`${name}:${id}`, 14) : 0);

  // labels: project after camera is known
  const labelShow = (props.labels ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.cubic)));
  const labels = (props.labels ?? []).map((l, i) => {
    let anchor: THREE.Vector3;
    if (typeof l.at === 'string') {
      const o = byId[l.at];
      anchor = o ? new THREE.Vector3(o.at[0], heightOf(o) + 0.05, o.at[1]) : new THREE.Vector3();
    } else anchor = new THREE.Vector3(...l.at);
    const [ax, ay] = project(target, zoom, anchor);
    const side = l.side ?? (ax > 560 ? 'right' : 'left');
    const dx = l.dx ?? (side === 'left' ? -150 : side === 'right' ? 150 : 0);
    const dy = l.dy ?? (side === 'up' ? -170 : -120);
    // keep the pill on screen (approx. width at 29 px), with a 40 px margin
    const wpx = l.text.length * 15 + 64;
    let lx = ax + dx;
    const left = side === 'left' ? lx - wpx : side === 'right' ? lx : lx - wpx / 2;
    if (left < 40) lx += 40 - left;
    if (left + wpx > W - 40) lx -= left + wpx - (W - 40);
    return {...l, ax, ay, lx, ly: ay + dy, side, o: labelShow[i]};
  });

  const moverPos = (m: Mover): THREE.Vector3 | null => {
    const pts = m.path.map((r) => pt(r, 0.55));
    if (pts.length < 2) return pts[0] ?? null;
    const moved = (st.moved ?? []).includes(m.id);
    if (!moved && !has(`move:${m.id}`)) return null;
    const legs = pts.length - 1;
    const dur = (m.dur ?? 20) * legs;
    const s0 = moved ? dur : since(`move:${m.id}`);
    if (s0 < 0) return null;
    const t = Math.min(1, s0 / dur) * legs;
    const k = Math.min(legs - 1, Math.floor(t));
    const u = Easing.inOut(Easing.quad)(t - k);
    const q = pts[k].clone().lerp(pts[k + 1], u);
    q.y += Math.sin(u * Math.PI) * 0.25;
    return q;
  };

  const docMat = useMemo(() => new THREE.MeshStandardMaterial({map: docTex('', '#2e9e5b') ?? undefined, roughness: 0.7}), []);
  const coinMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#e2a93b', metalness: 0.85, roughness: 0.3, emissive: new THREE.Color('#5a3a00'), emissiveIntensity: 0.4}), []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#191b1f', roughness: 0.85, metalness: 0.05}), []);
  const slabTop = useMemo(() => new THREE.MeshStandardMaterial({color: '#1e2025', roughness: 0.75, metalness: 0.05}), []);
  const slabGeo = useMemo(() => new RoundedBoxGeometry(world.w, 0.34, world.d, 3, 0.06), [world.w, world.d]);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <ThreeCanvas width={W} height={H} orthographic gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{zoom, near: 0.1, far: 400, position: [60, 52, 60]}}>
        <OrthoRig target={target} zoom={zoom} />
        <color attach="background" args={['#0a0b0d']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[-4, 10, 6]} intensity={1.5} />
        <directionalLight position={[8, 4, -2]} intensity={0.45} color="#9db8ff" />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={2} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          <Lightformer intensity={1.2} position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        </Environment>
        {/* the slab */}
        <mesh material={slabMat} position={[0, -0.17, 0]} geometry={slabGeo} />
        <mesh material={slabTop} position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[world.w - 0.12, world.d - 0.12]} />
        </mesh>
        {(props.links ?? []).map((l) => (
          <IsoLink
            key={l.id}
            a={pt(l.from)}
            b={pt(l.to)}
            style={l.style ?? 'dashed'}
            color={TONE[l.tone ?? ''] ?? '#d8dee8'}
            p={(st.links ?? []).includes(l.id) ? 1 : has(`link:${l.id}`) ? p(`link:${l.id}`, 22, Easing.out(Easing.cubic)) : 0}
            frame={frame}
          />
        ))}
        {objs.map((o) => (
          <IsoThing
            key={o.id}
            o={o}
            vis={visOf(o.id)}
            alert={flag('alert', o.id, st.alert)}
            good={flag('good', o.id, st.good)}
            frozen={flag('freeze', o.id, st.frozen)}
            pulse={has(`pulse:${o.id}`) ? Math.max(0, 1 - Math.abs(since(`pulse:${o.id}`) - 6) / 6) : 0}
            off={flag('off', o.id, st.off)}
            frame={frame}
          />
        ))}
        {(props.movers ?? []).map((m) => {
          const q = moverPos(m);
          if (!q) return null;
          return m.kind === 'coin' ? (
            <mesh key={m.id} material={coinMat} position={q.toArray()} rotation={[Math.PI / 2, 0, frame / 6]}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
            </mesh>
          ) : (
            <mesh key={m.id} material={docMat} position={q.toArray()} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.55, 0.38, 0.03]} />
            </mesh>
          );
        })}
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.9} luminanceThreshold={0.62} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
          <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </ThreeCanvas>
      {/* label pills with leader lines */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {labels.map((l, i) =>
          l.o > 0 ? (
            <line key={i} x1={l.lx} y1={l.ly + 20} x2={l.lx + (l.ax - l.lx) * l.o} y2={l.ly + 20 + (l.ay - l.ly - 20) * l.o} stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
          ) : null,
        )}
      </svg>
      {labels.map((l, i) =>
        l.o > 0 ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: l.lx,
              top: l.ly,
              transform: `translate(${l.side === 'left' ? '-100%' : l.side === 'right' ? '0%' : '-50%'}, -50%) translateY(${(1 - l.o) * 10}px)`,
              opacity: l.o,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(26,28,33,0.94)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 22,
              padding: '10px 20px 11px 16px',
              fontFamily: theme.font,
              fontSize: 29,
              fontWeight: 600,
              color: '#f2f4f7',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{width: 11, height: 11, borderRadius: 6, background: TONE[l.tone ?? ''] ?? '#3ddc84', boxShadow: `0 0 10px ${TONE[l.tone ?? ''] ?? '#3ddc84'}`}} />
            {l.text}
          </div>
        ) : null,
      )}
      <Tags tags={props.tags ?? []} show={(props.tags ?? []).map((_, i) => p(`tag:${i}`, 12, Easing.out(Easing.cubic)))} />
      {props.caption ? (
        <div style={{position: 'absolute', left: 60, top: 1470, fontFamily: theme.font, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.6)'}}>{props.caption}</div>
      ) : null}
    </div>
  );
};

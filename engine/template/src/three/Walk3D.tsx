import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {BlobShadow, Studio, Tags, canvasTex, clamp01, projectTo, rand, useCamera, useClock, type Cam, type Tag} from './kit';

/**
 * Walk3D — a third-person "follow-cam" world (2 Nov 2026, Edu: "make the person walking around like a third person observation
 * and animations"). One grounded, adult-proportioned person walks along a built street (shops, lamps, parked cars, a dawn sky);
 * the camera is keyed RELATIVE to her (so it trails / orbits her as she moves), and each consequence is an animation in the
 * world around her. Generic: the street's stops are set by props.stops (signs + kind), so later reels can reuse it.
 *
 * World: sidewalk along +x at y = 0 (z ∈ [-1.6, 1.6]); façades at z = -2.2; road at z > 1.8.
 * actions (one per beat):
 *   walk        walk from props.from to props.to over props.walkDur frames (default: if from ≠ to and no "walk", walks from frame 0)
 *   jump        quick walk to props.jumpTo (e.g. skipping a queue)
 *   phone pay cup slump search idle   poses (phone in hand / reach to a terminal / hold a coffee / head down / pat pockets)
 *   face        turn to props.face (radians; 0 = towards camera side +z, π/2 = walking direction +x, π = facing the shops)
 *   pending paid locked zero bolt refund  the phone screen state (also shown as a floating ring over her head for pending/paid)
 *   drop        a paper card with 12 words slips from her pocket and flutters away into the drain
 *   arc         a lightning arc from her phone to the nearest terminal
 *   funnel      payments (dots) rise from every window and squeeze through one glowing gate above the street
 *   sour        green wavy lines over the cup
 *   shutter     the bank's shutter rolls down
 *   card        name card (props.card)       pin:<n>  show pin n    hide:<n>  hide pin n       cam  (no-op beat for cam[])
 * props: from, to, walkDur, jumpTo, face, card{name, role, note, y}, pins[{text, at:[x,y,z], rel?, dx?, dy?, tone, size, pill}],
 *   tags (plain 2D tags, shown with label:<n>), cam (rel to her, unless camAbs), camAbs, queue (number of people in line),
 *   stops[{x, kind: "cafe"|"bank"|"home"|"kiosk"|"shop", sign}], colours {top, legs, hair, skin}, screen (starting phone state)
 */
type V3 = [number, number, number];
type Pin = {text: string; at: V3; rel?: boolean; dx?: number; dy?: number; tone?: Tag['tone']; size?: number; pill?: boolean};
type Stop = {x: number; kind: 'cafe' | 'bank' | 'home' | 'kiosk' | 'shop'; sign?: string};
type P = {
  actions?: string[];
  cam?: Cam[];
  camAbs?: boolean;
  from?: number;
  to?: number;
  walkDur?: number;
  jumpTo?: number;
  face?: number;
  card?: {name: string; role?: string; note?: string; y?: number};
  pins?: Pin[];
  tags?: Tag[];
  queue?: number;
  queueX?: number;
  stops?: Stop[];
  colours?: {top?: string; legs?: string; hair?: string; skin?: string};
  screen?: string;
  z?: number;
};

const DEFAULT_STOPS: Stop[] = [
  {x: -6, kind: 'shop', sign: 'BOOKS'},
  {x: -1.5, kind: 'shop', sign: 'MARKET'},
  {x: 9, kind: 'cafe', sign: 'CAFÉ'},
  {x: 13, kind: 'bank', sign: 'BANK'},
  {x: 21, kind: 'home', sign: '12'},
  {x: 29.5, kind: 'kiosk', sign: '⚡ LIGHTNING'},
  {x: 38, kind: 'shop', sign: 'BAKERY'},
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const UP = new THREE.Vector3(0, 1, 0);

const Bone: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r: number; mat: THREE.Material}> = ({a, b, r, mat}) => {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  return (
    <mesh material={mat} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q}>
      <capsuleGeometry args={[r, Math.max(0.01, len), 5, 12]} />
    </mesh>
  );
};

const solveArm = (S: THREE.Vector3, H: THREE.Vector3, pole: THREE.Vector3, L1 = 0.29, L2 = 0.27) => {
  const d = H.clone().sub(S);
  const dist = THREE.MathUtils.clamp(d.length(), 0.05, L1 + L2 - 0.002);
  const dir = d.normalize();
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  const pv = pole.clone().sub(S);
  pv.sub(dir.clone().multiplyScalar(pv.dot(dir)));
  if (pv.lengthSq() < 1e-6) pv.set(0, 0, -1);
  pv.normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(L1 * Math.cos(a))).add(pv.multiplyScalar(L1 * Math.sin(a)));
  return {E, H: S.clone().add(dir.clone().multiplyScalar(dist))};
};

// ---------- textures ----------
const screenTex = (state: string) =>
  canvasTex(200, 400, (g) => {
    const bg: Record<string, [string, string]> = {
      none: ['#101826', '#1b2a44'],
      pending: ['#3a2706', '#8a5a0a'],
      paid: ['#06321b', '#0f7a43'],
      locked: ['#3a0710', '#9a1424'],
      zero: ['#24070c', '#5a0f1a'],
      bolt: ['#1a1440', '#5b3df0'],
      refund: ['#1f2530', '#3a4454'],
    };
    const [a, b] = bg[state] ?? bg.none;
    const grd = g.createLinearGradient(0, 0, 0, 400);
    grd.addColorStop(0, a);
    grd.addColorStop(1, b);
    g.fillStyle = grd;
    g.fillRect(0, 0, 200, 400);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    const big: Record<string, string> = {none: '₿', pending: '⏳', paid: '✓', locked: '🔒', zero: '0', bolt: '⚡', refund: '↩'};
    const small: Record<string, string> = {none: 'WALLET', pending: 'PENDING', paid: 'PAID', locked: 'LOCKED', zero: '₿ 0.000', bolt: 'PAID', refund: 'NO UNDO'};
    g.font = '900 120px "DejaVu Sans", Arial, sans-serif';
    g.fillText(big[state] ?? '₿', 100, 210);
    g.font = '800 30px "DejaVu Sans", Arial, sans-serif';
    g.fillText(small[state] ?? '', 100, 300);
  });

const signTex = (text: string, bg: string, fg: string, w = 512, h = 128) =>
  canvasTex(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `800 ${Math.round(h * 0.52)}px "DejaVu Sans", Arial, sans-serif`;
    g.fillText(text, w / 2, h / 2 + 4);
  });

const windowsTex = (seed: number, cols: number, rows: number) =>
  canvasTex(256, 512, (g) => {
    g.fillStyle = '#2b3346';
    g.fillRect(0, 0, 256, 512);
    const cw = 256 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const lit = rand(seed * 31 + r * 7 + c) > 0.55;
        g.fillStyle = lit ? (rand(seed + r + c * 3) > 0.5 ? '#ffd38a' : '#ffe9b8') : '#121a2a';
        g.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.2, cw * 0.64, rh * 0.6);
      }
  });

const phraseTex = () =>
  canvasTex(320, 220, (g) => {
    g.fillStyle = '#f4ecd8';
    g.fillRect(0, 0, 320, 220);
    g.fillStyle = '#3a3428';
    g.font = '700 19px "DejaVu Sans Mono", monospace';
    for (let i = 0; i < 12; i++) {
      const c = i % 3;
      const r = Math.floor(i / 3);
      g.fillText(`${i + 1}. ••••••`, 16 + c * 102, 44 + r * 46);
    }
  });

const stripeTex = (a: string, b: string) =>
  canvasTex(256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(i * 32, 0, 32, 64);
    }
  });

const skyTex = () =>
  canvasTex(16, 512, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#0b1430');
    grd.addColorStop(0.45, '#2a3a6e');
    grd.addColorStop(0.72, '#c66f5a');
    grd.addColorStop(0.86, '#f3b46e');
    grd.addColorStop(1, '#f6d39a');
    g.fillStyle = grd;
    g.fillRect(0, 0, 16, 512);
  });

const NameCard: React.FC<{p: number; name: string; role?: string; note?: string; y?: number}> = ({p, name, role, note, y = 1180}) => (
  <div style={{position: 'absolute', left: 90, width: 780, top: y, opacity: clamp01(p * 1.5), transform: `translateY(${(1 - p) * 34}px)`, fontFamily: theme.font}}>
    <div style={{display: 'flex', gap: 24, background: 'rgba(9,13,22,0.84)', border: '1.5px solid rgba(255,255,255,0.16)', borderRadius: 24, padding: '22px 30px', boxShadow: '0 18px 50px rgba(0,0,0,0.45)'}}>
      <div style={{width: 9, borderRadius: 5, background: '#3bc9ee', transform: `scaleY(${clamp01(p * 1.3)})`, transformOrigin: 'top'}} />
      <div>
        <div style={{fontSize: 62, fontWeight: 800, color: '#fff', letterSpacing: 1.5, lineHeight: 1.05}}>{name}</div>
        {role ? <div style={{fontSize: 33, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 10}}>{role}</div> : null}
        {note ? <div style={{fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 12, letterSpacing: 2.5, textTransform: 'uppercase'}}>{note}</div> : null}
      </div>
    </div>
  </div>
);

const POSES = ['phone', 'pay', 'cup', 'slump', 'search', 'idle'];
const SCREENS = ['pending', 'paid', 'locked', 'zero', 'bolt', 'refund'];

export const Walk3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, at, p, since, has} = useClock(beats, acts);
  const col = {top: '#d9893a', legs: '#2b3444', hair: '#2a1a12', skin: '#c48a64', ...(props.colours ?? {})};
  const stops = props.stops ?? DEFAULT_STOPS;
  const z0 = props.z ?? 0;

  // ---- root motion ----
  const from = props.from ?? 0;
  const to = props.to ?? from;
  const walkDur = props.walkDur ?? Math.max(20, durationInFrames - 6);
  const wStart = has('walk') ? (at('walk') as number) : from !== to ? 0 : 1e9;
  const posAt = (f: number) => {
    let x = from;
    if (f >= wStart) {
      const t = clamp01((f - wStart) / walkDur);
      const e = Easing.inOut(Easing.quad)(t);
      x = lerp(from, to, clamp01(e));
    }
    const jf = at('jump');
    if (jf !== null && props.jumpTo !== undefined) {
      const tj = interpolate(f, [jf, jf + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
      x = lerp(x, props.jumpTo, tj);
    }
    return x;
  };
  const x = posAt(frame);
  const speed = Math.abs(posAt(frame + 1) - posAt(frame - 1)) / 2; // units / frame
  const moving = clamp01(speed / 0.035);
  // walk phase from distance travelled (feet don't slide): stride ≈ 1.25 units per cycle
  let dist = 0;
  for (let f = 0; f < frame; f += 1) dist += Math.abs(posAt(f + 1) - posAt(f));
  const phase = (dist / 1.25) * Math.PI * 2;
  const dirSign = to >= from || (props.jumpTo ?? 0) > from ? 1 : -1;

  // heading
  const walkHeading = dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  const faceW = has('face') ? p('face', 16) : 0;
  const restHeading = props.face ?? walkHeading;
  const heading = lerp(walkHeading, lerp(walkHeading, restHeading, faceW), 1 - moving);

  // ---- pose: hand targets in character space (+z forward, +x her left) ----
  type Pose = {rh: V3; lh: V3; head: number; turn: number; lean: number};
  const sway = Math.sin(phase);
  const walkPose: Pose = {
    rh: [-0.24, 0.86, 0.2 * sway * moving + 0.03],
    lh: [0.24, 0.86, -0.2 * sway * moving + 0.03],
    head: 0.05 * Math.sin(frame / 37),
    turn: 0.05 * Math.sin(frame / 53),
    lean: 0.05 * moving,
  };
  const P: Record<string, Pose> = {
    idle: {rh: [-0.24, 0.86, 0.04], lh: [0.24, 0.86, 0.04], head: 0.04 * Math.sin(frame / 31), turn: 0.06 * Math.sin(frame / 47), lean: 0},
    phone: {rh: [-0.05, 1.16, 0.3], lh: [0.2, 0.9, 0.06], head: 0.42, turn: 0, lean: 0.04},
    pay: {rh: [-0.08, 1.2, 0.52], lh: [0.22, 0.88, 0.05], head: 0.25, turn: 0, lean: 0.08},
    cup: {rh: [-0.05, 1.16, 0.3], lh: [0.12, 1.12, 0.28], head: 0.3, turn: 0.1, lean: 0.02},
    slump: {rh: [-0.06, 1.08, 0.26], lh: [0.22, 0.84, 0.0], head: 0.62, turn: 0, lean: 0.18},
    search: {rh: [-0.22, 0.98, 0.1 + 0.04 * Math.sin(frame / 4)], lh: [0.22, 0.98, 0.1 + 0.04 * Math.sin(frame / 4 + 2)], head: 0.35, turn: 0.4 * Math.sin(frame / 14), lean: 0.1},
  };
  let pose: Pose = props.screen && !has('idle') ? P.phone : P.idle;
  acts.forEach((a) => {
    if (!POSES.includes(a)) return;
    const f0 = at(a);
    if (f0 === null || frame < f0) return;
    const w = interpolate(frame, [f0, f0 + 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    const b = P[a];
    pose = {
      rh: [lerp(pose.rh[0], b.rh[0], w), lerp(pose.rh[1], b.rh[1], w), lerp(pose.rh[2], b.rh[2], w)],
      lh: [lerp(pose.lh[0], b.lh[0], w), lerp(pose.lh[1], b.lh[1], w), lerp(pose.lh[2], b.lh[2], w)],
      head: lerp(pose.head, b.head, w),
      turn: lerp(pose.turn, b.turn, w),
      lean: lerp(pose.lean, b.lean, w),
    };
  });
  // blend walking arms in while moving (but keep a raised phone/cup hand)
  const mix = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rhRaised = pose.rh[1] > 1.0;
  const lhRaised = pose.lh[1] > 1.0;
  pose = {
    ...pose,
    rh: rhRaised ? pose.rh : mix(pose.rh, walkPose.rh, moving),
    lh: lhRaised ? pose.lh : mix(pose.lh, walkPose.lh, moving),
    head: lerp(pose.head, Math.min(pose.head, 0.25) + 0.02, moving * 0.5),
    lean: Math.max(pose.lean, walkPose.lean),
  };

  // ---- legs ----
  const HIP_Y = 0.93;
  const T = 0.45;
  const S = 0.43;
  const legOf = (s: number, ph: number) => {
    const th = 0.42 * Math.sin(ph) * moving;
    const kn = (0.06 + 0.8 * Math.pow(Math.max(0, Math.cos(ph)), 1.6)) * moving + 0.04;
    const hip = new THREE.Vector3(s * 0.095, HIP_Y, 0);
    const knee = hip.clone().add(new THREE.Vector3(0, -T * Math.cos(th), T * Math.sin(th)));
    const sh = th - kn;
    const ankle = knee.clone().add(new THREE.Vector3(0, -S * Math.cos(sh), S * Math.sin(sh)));
    return {hip, knee, ankle, sh};
  };
  const Lr = legOf(-1, phase);
  const Ll = legOf(1, phase + Math.PI);
  const drop = Math.min(Lr.ankle.y, Ll.ankle.y) - 0.065;
  const bodyY = -drop;

  const torsoTilt = pose.lean;
  const chest = new THREE.Vector3(0, 1.27, 0);
  const shoulderOf = (s: number) => new THREE.Vector3(s * 0.2, 1.43, 0.0).applyAxisAngle(new THREE.Vector3(1, 0, 0), torsoTilt);
  const Sr = shoulderOf(-1);
  const Sl = shoulderOf(1);
  const R = solveArm(Sr, new THREE.Vector3(...pose.rh), new THREE.Vector3(-0.6, 0.9, -0.6));
  const Lf = solveArm(Sl, new THREE.Vector3(...pose.lh), new THREE.Vector3(0.6, 0.9, -0.6));

  // ---- materials ----
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({color: col.skin, roughness: 0.6}),
      hair: new THREE.MeshStandardMaterial({color: col.hair, roughness: 0.7}),
      top: new THREE.MeshStandardMaterial({color: col.top, roughness: 0.8}),
      topDark: new THREE.MeshStandardMaterial({color: new THREE.Color(col.top).multiplyScalar(0.7), roughness: 0.85}),
      legs: new THREE.MeshStandardMaterial({color: col.legs, roughness: 0.85}),
      shoe: new THREE.MeshStandardMaterial({color: '#e8e8e4', roughness: 0.6}),
      eye: new THREE.MeshStandardMaterial({color: '#141414', roughness: 0.3}),
      mouth: new THREE.MeshStandardMaterial({color: '#7a3b30', roughness: 0.6}),
      bag: new THREE.MeshStandardMaterial({color: '#5a3b26', roughness: 0.7}),
      pawn: new THREE.MeshStandardMaterial({color: '#6f7d93', roughness: 0.75}),
      pawnHead: new THREE.MeshStandardMaterial({color: '#8a97ab', roughness: 0.7}),
      walk: new THREE.MeshStandardMaterial({color: '#8d929b', roughness: 0.92}),
      curb: new THREE.MeshStandardMaterial({color: '#a9adb4', roughness: 0.85}),
      road: new THREE.MeshStandardMaterial({color: '#262a31', roughness: 0.95}),
      dash: new THREE.MeshStandardMaterial({color: '#e8dfc4', roughness: 0.8}),
      pole: new THREE.MeshStandardMaterial({color: '#2a2f38', metalness: 0.6, roughness: 0.4}),
      bulb: new THREE.MeshStandardMaterial({color: '#ffe2a8', emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 2.2, toneMapped: false}),
      glass: new THREE.MeshStandardMaterial({color: '#1d2a3c', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.3}),
      counter: new THREE.MeshStandardMaterial({color: '#6b4630', roughness: 0.6}),
      counterTop: new THREE.MeshStandardMaterial({color: '#d9d4c7', roughness: 0.4}),
      metal: new THREE.MeshStandardMaterial({color: '#9aa2ad', metalness: 0.8, roughness: 0.35}),
      dark: new THREE.MeshStandardMaterial({color: '#161a20', roughness: 0.5}),
      cup: new THREE.MeshStandardMaterial({color: '#f3efe6', roughness: 0.5}),
      lid: new THREE.MeshStandardMaterial({color: '#3a2a20', roughness: 0.5}),
      paper: new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide}),
      gold: new THREE.MeshStandardMaterial({color: '#f2c45a', metalness: 0.9, roughness: 0.3, emissive: new THREE.Color('#7a5208'), emissiveIntensity: 0.4}),
      ringAmber: new THREE.MeshStandardMaterial({color: '#ffb547', emissive: new THREE.Color('#ffb547'), emissiveIntensity: 2.5, toneMapped: false}),
      ringGreen: new THREE.MeshStandardMaterial({color: '#3ddc84', emissive: new THREE.Color('#3ddc84'), emissiveIntensity: 2.5, toneMapped: false}),
      bolt: new THREE.MeshStandardMaterial({color: '#cfc4ff', emissive: new THREE.Color('#8f7bff'), emissiveIntensity: 4, toneMapped: false}),
      sour: new THREE.MeshStandardMaterial({color: '#9be36a', emissive: new THREE.Color('#7ed957'), emissiveIntensity: 1.6, toneMapped: false}),
      dot: new THREE.MeshStandardMaterial({color: '#7fe3ff', emissive: new THREE.Color('#3bc9ee'), emissiveIntensity: 3, toneMapped: false}),
      gate: new THREE.MeshStandardMaterial({color: '#3bc9ee', emissive: new THREE.Color('#3bc9ee'), emissiveIntensity: 2.8, toneMapped: false}),
      shutter: new THREE.MeshStandardMaterial({color: '#7d848f', metalness: 0.7, roughness: 0.45}),
      car: [new THREE.MeshStandardMaterial({color: '#a33a3a', metalness: 0.5, roughness: 0.35}), new THREE.MeshStandardMaterial({color: '#2f5f8f', metalness: 0.5, roughness: 0.35}), new THREE.MeshStandardMaterial({color: '#d8d2c4', metalness: 0.5, roughness: 0.35})],
      tyre: new THREE.MeshStandardMaterial({color: '#111', roughness: 0.9}),
    }),
    [col.skin, col.hair, col.top, col.legs],
  );
  const torsoGeo = useMemo(() => new RoundedBoxGeometry(0.38, 0.5, 0.23, 4, 0.09), []);
  const hipGeo = useMemo(() => new RoundedBoxGeometry(0.34, 0.18, 0.22, 3, 0.07), []);
  const shoeGeo = useMemo(() => new RoundedBoxGeometry(0.1, 0.075, 0.25, 3, 0.03), []);
  const phoneGeo = useMemo(() => new RoundedBoxGeometry(0.08, 0.16, 0.012, 2, 0.006), []);
  const carGeo = useMemo(() => new RoundedBoxGeometry(3.9, 0.7, 1.7, 4, 0.2), []);
  const cabinGeo = useMemo(() => new RoundedBoxGeometry(2.1, 0.6, 1.5, 4, 0.22), []);
  const screens = useMemo(() => Object.fromEntries(['none', ...SCREENS].map((s) => [s, screenTex(s)])), []);
  const sky = useMemo(() => skyTex(), []);
  const phrase = useMemo(() => phraseTex(), []);
  const awning = useMemo(() => stripeTex('#2f6f62', '#efe6d2'), []);
  const facadeTex = useMemo(() => Array.from({length: 6}).map((_, i) => windowsTex(i + 1, 4, 8)), []);
  const signs = useMemo(
    () =>
      stops.map((s) =>
        s.kind === 'bank'
          ? signTex(s.sign ?? 'BANK', '#1c2330', '#8b95a5')
          : s.kind === 'kiosk'
            ? signTex(s.sign ?? 'KIOSK', '#1b1440', '#c9bcff')
            : s.kind === 'home'
              ? signTex(s.sign ?? '12', '#20262f', '#e9e2cf', 256, 128)
              : signTex(s.sign ?? 'SHOP', s.kind === 'cafe' ? '#2f6f62' : '#3a2b22', '#fff1d6'),
      ),
    [stops],
  );
  const closedTex = useMemo(() => signTex('CLOSED', '#7a1420', '#ffffff', 256, 80), []);

  // ---- phone screen state ----
  let scr = props.screen ?? 'none';
  let scrAt = -1;
  acts.forEach((a) => {
    if (!SCREENS.includes(a)) return;
    const f0 = at(a);
    if (f0 !== null && frame >= f0 && f0 >= scrAt) {
      scr = a;
      scrAt = f0;
    }
  });
  const phoneOn = pose.rh[1] > 1.0 || props.screen !== undefined;

  // ---- camera (relative to her unless camAbs) ----
  const camRel = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [-3.4, 2.3, 5.2], look: [0.9, 1.0, 0], fov: 36});
  const off = props.camAbs ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(x, 0, z0);
  const cam = {pos: camRel.pos.clone().add(off), look: camRel.look.clone().add(off), fov: camRel.fov};

  // ---- props timing ----
  const dropS = since('drop');
  const arcS = since('arc');
  const sourS = since('sour');
  const funS = since('funnel');
  const shutP = has('shutter') ? p('shutter', 26, Easing.out(Easing.quad)) : 0;
  const pend = scr === 'pending';
  const paid = scr === 'paid' || scr === 'bolt';
  const ringOn = (pend || paid) && scrAt >= 0 ? clamp01((frame - scrAt) / 8) : 0;

  // ---- overlay ----
  const cardP = p('card', 14, Easing.out(Easing.cubic));
  const pinTags: Tag[] = (props.pins ?? []).map((pin) => {
    const w: V3 = pin.rel === false ? pin.at : [pin.at[0] + x, pin.at[1], pin.at[2] + z0];
    const [px, py] = projectTo(cam, w);
    const fs = pin.size ?? 40;
    const hw = (pin.text.length * (fs * 0.66 + 4) + fs) / 2;
    const tx = Math.max(50 + hw, Math.min(1030 - hw, px + (pin.dx ?? 0)));
    const ty = Math.max(380, Math.min(1500, py + (pin.dy ?? -150)));
    return {text: pin.text, x: tx, y: ty, to: [px, py] as [number, number], tone: pin.tone, size: pin.size ?? 40, pill: pin.pill ?? true};
  });
  const pinShow = pinTags.map((_, i) => p(`pin:${i}`, 10, Easing.out(Easing.back(1.5))) * (1 - p(`hide:${i}`, 8)));
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      <Tags tags={pinTags} show={pinShow} />
      {props.card && cardP > 0 ? <NameCard p={cardP} {...props.card} /> : null}
    </>
  );

  // ---- queue pawns ----
  const qn = props.queue ?? 0;
  const qx = props.queueX ?? 9.3;

  // ---- funnel particles ----
  const NF = 90;
  const fun = useMemo(
    () =>
      Array.from({length: NF}).map((_, i) => ({
        sx: -10 + rand(i + 1) * 22,
        sy: 1.5 + rand(i + 2) * 6,
        sz: -2.15,
        d: rand(i + 3) * 40,
        k: i,
      })),
    [],
  );
  const gate = new THREE.Vector3(1.2, 5.0, -0.6);

  const facades = useMemo(() => {
    const out: {x: number; w: number; h: number; t: number; c: string}[] = [];
    let cx = -14;
    let i = 0;
    while (cx < 46) {
      const w = 3 + rand(i + 11) * 2.2;
      out.push({x: cx + w / 2, w, h: 5 + rand(i + 5) * 6, t: i % 6, c: ['#7b5a4a', '#5b6a7d', '#8a7a62', '#4f5d6a', '#9a6e55', '#6b6f78'][i % 6]});
      cx += w + 0.08;
      i++;
    }
    return out;
  }, []);

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.9} warm={0.25}>
      <fog attach="fog" args={['#2a2f4a', 16, 46]} />
      {/* dawn sky */}
      <mesh position={[x + 0, 14, -34]}>
        <planeGeometry args={[160, 46]} />
        <meshBasicMaterial map={sky ?? undefined} fog={false} />
      </mesh>
      <pointLight position={[x + 2, 4, 3]} intensity={0.8} distance={12} color="#ffd2a0" />
      {/* sidewalk, curb, road */}
      <mesh material={mats.walk} position={[16, -0.06, -0.3]}>
        <boxGeometry args={[80, 0.12, 4.0]} />
      </mesh>
      {Array.from({length: 54}).map((_, i) => (
        <mesh key={i} position={[-14 + i * 1.5, 0.002, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 3.9]} />
          <meshBasicMaterial color="#6d727b" />
        </mesh>
      ))}
      <mesh material={mats.curb} position={[16, -0.04, 1.75]}>
        <boxGeometry args={[80, 0.18, 0.2]} />
      </mesh>
      <mesh material={mats.road} position={[16, -0.14, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 8.4]} />
      </mesh>
      {Array.from({length: 22}).map((_, i) => (
        <mesh key={i} material={mats.dash} position={[-14 + i * 3.6, -0.13, 6.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 0.14]} />
        </mesh>
      ))}
      {/* parked cars */}
      {[
        [3.5, 0],
        [15.5, 1],
        [24.5, 2],
        [36, 0],
      ].map(([cx, ci], i) => (
        <group key={i} position={[cx, 0.32, 3.0]}>
          <mesh geometry={carGeo} material={mats.car[ci]} />
          <mesh geometry={cabinGeo} material={mats.car[ci]} position={[-0.2, 0.55, 0]} />
          <mesh material={mats.glass} position={[-0.2, 0.58, 0.76]}>
            <boxGeometry args={[1.8, 0.4, 0.02]} />
          </mesh>
          {[-1.25, 1.25].map((wx) =>
            [-0.8, 0.8].map((wz) => (
              <mesh key={`${wx}${wz}`} material={mats.tyre} position={[wx, -0.25, wz]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 0.2, 18]} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {/* street lamps */}
      {Array.from({length: 10}).map((_, i) => (
        <group key={i} position={[-10 + i * 6, 0, 1.45]}>
          <mesh material={mats.pole} position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 4.0, 10]} />
          </mesh>
          <mesh material={mats.pole} position={[0, 3.98, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
          </mesh>
          <mesh material={mats.bulb} position={[0, 3.9, -0.58]}>
            <sphereGeometry args={[0.13, 14, 10]} />
          </mesh>
        </group>
      ))}
      {/* façades */}
      {facades.map((f, i) => (
        <group key={i} position={[f.x, 0, -2.2 - f.w * 0.02]}>
          <mesh position={[0, f.h / 2, -0.4]}>
            <boxGeometry args={[f.w, f.h, 0.8]} />
            <meshStandardMaterial color={f.c} roughness={0.85} />
          </mesh>
          <mesh position={[0, (f.h + 3) / 2, 0.01]}>
            <planeGeometry args={[f.w * 0.9, f.h - 3.2]} />
            <meshStandardMaterial map={facadeTex[f.t] ?? undefined} roughness={0.6} emissive={new THREE.Color('#ffd38a')} emissiveIntensity={0.18} emissiveMap={facadeTex[f.t] ?? undefined} />
          </mesh>
          <mesh material={mats.glass} position={[0, 1.15, 0.02]}>
            <planeGeometry args={[f.w * 0.8, 1.9]} />
          </mesh>
          <mesh position={[0, 2.62, 0.04]}>
            <boxGeometry args={[f.w, 0.12, 0.1]} />
            <meshStandardMaterial color="#222830" />
          </mesh>
        </group>
      ))}
      {/* stops: signs and their props */}
      {stops.map((s, i) => (
        <group key={i} position={[s.x, 0, -2.0]}>
          <mesh position={[0, 2.95, 0.14]}>
            <planeGeometry args={[s.kind === 'home' ? 0.6 : 2.4, s.kind === 'home' ? 0.3 : 0.6]} />
            <meshStandardMaterial map={signs[i] ?? undefined} emissiveMap={signs[i] ?? undefined} emissive={new THREE.Color('#ffffff')} emissiveIntensity={s.kind === 'bank' ? 0.15 : 0.7} />
          </mesh>
          {s.kind === 'cafe' ? (
            <group>
              <mesh position={[0, 2.5, 0.55]} rotation={[0.5, 0, 0]}>
                <planeGeometry args={[3.0, 1.1]} />
                <meshStandardMaterial map={awning ?? undefined} side={THREE.DoubleSide} roughness={0.8} />
              </mesh>
              {/* counter + terminal + machine + barista */}
              <mesh material={mats.counter} position={[0.3, 0.5, 0.75]}>
                <boxGeometry args={[2.2, 1.0, 0.6]} />
              </mesh>
              <mesh material={mats.counterTop} position={[0.3, 1.02, 0.75]}>
                <boxGeometry args={[2.3, 0.05, 0.7]} />
              </mesh>
              <mesh material={mats.metal} position={[0.9, 1.25, 0.65]}>
                <boxGeometry args={[0.45, 0.42, 0.38]} />
              </mesh>
              <group position={[-0.25, 1.1, 0.95]} rotation={[-0.7, 0, 0]}>
                <mesh material={mats.dark}>
                  <boxGeometry args={[0.16, 0.05, 0.24]} />
                </mesh>
                <mesh position={[0, 0.027, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.13, 0.14]} />
                  <meshBasicMaterial map={(screens[pend ? 'pending' : paid ? 'paid' : 'none'] as THREE.Texture) ?? undefined} toneMapped={false} />
                </mesh>
              </group>
              <group position={[0.4, 0, 0.2]}>
                <mesh material={mats.pawn} position={[0, 1.1, 0]}>
                  <capsuleGeometry args={[0.2, 0.6, 4, 10]} />
                </mesh>
                <mesh material={mats.pawnHead} position={[0, 1.68, 0]}>
                  <sphereGeometry args={[0.13, 14, 12]} />
                </mesh>
              </group>
            </group>
          ) : null}
          {s.kind === 'kiosk' ? (
            <group>
              <mesh material={mats.counter} position={[0, 0.5, 0.75]}>
                <boxGeometry args={[1.6, 1.0, 0.6]} />
              </mesh>
              <mesh material={mats.counterTop} position={[0, 1.02, 0.75]}>
                <boxGeometry args={[1.7, 0.05, 0.7]} />
              </mesh>
              <group position={[-0.3, 1.1, 0.95]} rotation={[-0.7, 0, 0]}>
                <mesh material={mats.dark}>
                  <boxGeometry args={[0.16, 0.05, 0.24]} />
                </mesh>
                <mesh position={[0, 0.027, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.13, 0.14]} />
                  <meshBasicMaterial map={(screens[scr === 'bolt' ? 'bolt' : 'none'] as THREE.Texture) ?? undefined} toneMapped={false} />
                </mesh>
              </group>
            </group>
          ) : null}
          {s.kind === 'bank' ? (
            <group>
              {[-0.9, 0.9].map((cx) => (
                <mesh key={cx} position={[cx, 1.3, 0.25]} material={mats.counterTop}>
                  <cylinderGeometry args={[0.12, 0.12, 2.6, 14]} />
                </mesh>
              ))}
              <mesh material={mats.shutter} position={[0, 2.5 - 1.25 * shutP - (has('shutter') ? 0 : 1.25), 0.12]} scale={[1, has('shutter') ? 0.02 + shutP : 1, 1]}>
                <boxGeometry args={[1.5, 2.5, 0.04]} />
              </mesh>
              {Array.from({length: 12}).map((_, k) => (
                <mesh key={k} position={[0, 2.45 - k * 0.2, 0.15]} visible={!has('shutter') || 2.45 - k * 0.2 > 2.5 - 2.5 * shutP}>
                  <boxGeometry args={[1.5, 0.02, 0.02]} />
                  <meshStandardMaterial color="#5c626c" />
                </mesh>
              ))}
              <mesh position={[0, 1.4, 0.18]} visible={!has('shutter') || shutP > 0.8}>
                <planeGeometry args={[0.7, 0.22]} />
                <meshStandardMaterial map={closedTex ?? undefined} emissiveMap={closedTex ?? undefined} emissive={new THREE.Color('#ffffff')} emissiveIntensity={0.5} />
              </mesh>
            </group>
          ) : null}
          {s.kind === 'home' ? (
            <group>
              <mesh position={[0, 1.1, 0.04]}>
                <boxGeometry args={[1.0, 2.2, 0.08]} />
                <meshStandardMaterial color="#2c4a6b" roughness={0.6} />
              </mesh>
              <mesh material={mats.gold} position={[0.36, 1.05, 0.1]}>
                <sphereGeometry args={[0.04, 10, 8]} />
              </mesh>
              {[0, 1, 2].map((k) => (
                <mesh key={k} material={mats.curb} position={[0, 0.06 + k * 0.0, 0.3 + k * 0.25]}>
                  <boxGeometry args={[1.4, 0.12, 0.25]} />
                </mesh>
              ))}
            </group>
          ) : null}
        </group>
      ))}
      {/* storm drain (where the phrase ends up) */}
      <mesh position={[17.6, 0.004, 1.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.35]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.9} />
      </mesh>
      {/* queue pawns */}
      {Array.from({length: qn}).map((_, i) => (
        <group key={i} position={[qx - 0.75 * i, 0, -0.75]} rotation={[0, Math.PI + 0.2 * (rand(i) - 0.5), 0]}>
          <BlobShadow w={0.7} d={0.5} opacity={0.5} />
          <mesh material={mats.pawn} position={[0, 0.85, 0]}>
            <capsuleGeometry args={[0.19, 0.95, 4, 10]} />
          </mesh>
          <mesh material={mats.pawnHead} position={[0, 1.6 + 0.01 * Math.sin(frame / 20 + i), 0]}>
            <sphereGeometry args={[0.12, 14, 12]} />
          </mesh>
          {/* each one's payment ticket waiting */}
          <mesh material={mats.ringAmber} position={[0, 2.05, 0]} rotation={[Math.PI / 2, 0, frame / 9 + i]}>
            <torusGeometry args={[0.13, 0.018, 8, 24, Math.PI * 1.5]} />
          </mesh>
        </group>
      ))}
      {/* funnel: payments from every window squeezing through one gate */}
      {funS >= 0 ? (
        <group>
          <mesh material={mats.gate} position={gate} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.05, 10, 36]} />
          </mesh>
          {fun.map((d) => {
            const t = clamp01((funS - d.d * 0.6) / 40);
            if (t <= 0) return null;
            // queue up under the gate; only one in every few passes through
            const passK = Math.floor((funS - 40) / 4.3);
            const passed = d.k < passK && t >= 1;
            const qpos = new THREE.Vector3(gate.x + (rand(d.k + 8) - 0.5) * 2.6, gate.y - 0.6 - rand(d.k + 4) * 1.6, gate.z + (rand(d.k + 6) - 0.5) * 1.4);
            const start = new THREE.Vector3(d.sx + x * 0, d.sy, d.sz);
            let pos = start.clone().lerp(qpos, Easing.inOut(Easing.cubic)(t));
            if (passed) {
              const tp = clamp01((funS - 40 - d.k * 4.3) / 10);
              pos = qpos.clone().lerp(gate, Math.min(1, tp * 2));
              if (tp > 0.5) pos = gate.clone().add(new THREE.Vector3(0, (tp - 0.5) * 6, 0));
            }
            return (
              <mesh key={d.k} material={passed ? mats.ringGreen : mats.dot} position={pos}>
                <sphereGeometry args={[0.07, 8, 6]} />
              </mesh>
            );
          })}
        </group>
      ) : null}
      {/* lightning arc from her phone to the kiosk terminal */}
      {arcS >= 0 && arcS < 60
        ? (() => {
            const kiosk = stops.find((s) => s.kind === 'kiosk');
            const a = new THREE.Vector3(x - 0.2, 1.25, z0 + 0.25);
            const b = new THREE.Vector3((kiosk?.x ?? x + 1) - 0.3, 1.12, -1.05);
            const n = 9;
            const pts = Array.from({length: n + 1}).map((_, k) => {
              const v = a.clone().lerp(b, k / n);
              if (k > 0 && k < n) v.add(new THREE.Vector3((rand(k + Math.floor(arcS / 2)) - 0.5) * 0.25, (rand(k * 3 + Math.floor(arcS / 2)) - 0.5) * 0.3, 0));
              return v;
            });
            const grow = clamp01(arcS / 6);
            const fade = 1 - clamp01((arcS - 40) / 20);
            return fade > 0
              ? pts.slice(0, Math.max(1, Math.round(n * grow))).map((v, k) => <Bone key={k} a={v} b={pts[k + 1]} r={0.018 * fade + 0.004} mat={mats.bolt} />)
              : null;
          })()
        : null}
      {arcS >= 0 && arcS < 50 ? <pointLight position={[x + 0.4, 1.4, 0]} intensity={3 * (1 - clamp01(arcS / 50))} distance={4} color="#a08cff" /> : null}

      {/* ---- Maya ---- */}
      <group position={[x, bodyY, z0]} rotation={[0, heading, 0]}>
        <BlobShadow w={0.8} d={0.6} opacity={0.6} position={[0, 0.006 - bodyY, 0]} />
        {[Lr, Ll].map((L, i) => (
          <group key={i}>
            <Bone a={L.hip} b={L.knee} r={0.072} mat={mats.legs} />
            <Bone a={L.knee} b={L.ankle} r={0.058} mat={mats.legs} />
            <group position={[L.ankle.x, L.ankle.y - 0.03, L.ankle.z + 0.06]} rotation={[-L.sh * 0.5, 0, 0]}>
              <mesh geometry={shoeGeo} material={mats.shoe} />
            </group>
          </group>
        ))}
        <mesh geometry={hipGeo} material={mats.legs} position={[0, HIP_Y + 0.03, 0]} />
        <group rotation={[torsoTilt, 0, 0]}>
          <mesh geometry={torsoGeo} material={mats.top} position={[0, 1.25, 0]} />
          {/* collar + bag strap */}
          <mesh material={mats.topDark} position={[0, 1.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.085, 0.03, 8, 20]} />
          </mesh>
          <mesh material={mats.bag} position={[0, 1.27, 0]} rotation={[0, 0, 0.75]}>
            <boxGeometry args={[0.03, 0.62, 0.25]} />
          </mesh>
          <mesh material={mats.bag} position={[0.23, 0.98, 0.0]}>
            <boxGeometry args={[0.08, 0.22, 0.26]} />
          </mesh>
          {/* neck + head */}
          <mesh material={mats.skin} position={[0, 1.54, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.1, 12]} />
          </mesh>
          <group position={[0, 1.6, 0]} rotation={[pose.head, pose.turn, 0]}>
            <mesh material={mats.skin} position={[0, 0.07, 0.01]} scale={[0.88, 1.08, 0.98]}>
              <sphereGeometry args={[0.1, 28, 20]} />
            </mesh>
            {/* hair: cap + ponytail */}
            <mesh material={mats.hair} position={[0, 0.095, -0.005]} scale={[0.93, 1.06, 1.02]}>
              <sphereGeometry args={[0.104, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
            <mesh material={mats.hair} position={[0, 0.05, -0.04]} scale={[0.92, 1, 0.9]}>
              <sphereGeometry args={[0.1, 20, 14, Math.PI * 0.6, Math.PI * 0.8]} />
            </mesh>
            <group position={[0, 0.1, -0.11]} rotation={[0.5 + 0.08 * Math.sin(phase) * moving, 0, 0]}>
              <mesh material={mats.hair} position={[0, -0.09, 0]}>
                <capsuleGeometry args={[0.03, 0.14, 4, 8]} />
              </mesh>
            </group>
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh material={mats.eye} position={[s * 0.034, 0.072, 0.09]} scale={[1, (frame + 17) % 110 < 4 ? 0.15 : 1.25, 0.6]}>
                  <sphereGeometry args={[0.0145, 10, 8]} />
                </mesh>
                <mesh material={mats.hair} position={[s * 0.036, 0.1, 0.092]} rotation={[0, 0, s * -0.12]}>
                  <boxGeometry args={[0.034, 0.007, 0.01]} />
                </mesh>
              </group>
            ))}
            <mesh material={mats.mouth} position={[0, 0.018, 0.093]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.004, 0.022, 3, 6]} />
            </mesh>
            <mesh material={mats.skin} position={[0, 0.05, 0.1]}>
              <sphereGeometry args={[0.014, 8, 6]} />
            </mesh>
          </group>
        </group>
        {/* arms */}
        {[
          {Sh: Sr, A: R},
          {Sh: Sl, A: Lf},
        ].map(({Sh, A}, i) => (
          <group key={i}>
            <mesh material={mats.top} position={Sh}>
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
            <Bone a={Sh} b={A.E} r={0.055} mat={mats.top} />
            <Bone a={A.E} b={A.H} r={0.045} mat={mats.top} />
            <mesh material={mats.skin} position={A.H.clone().add(A.H.clone().sub(A.E).normalize().multiplyScalar(0.04))} scale={[0.8, 1, 0.6]}>
              <sphereGeometry args={[0.05, 12, 10]} />
            </mesh>
          </group>
        ))}
        {/* phone in the right hand */}
        {phoneOn ? (
          <group position={R.H.clone().add(new THREE.Vector3(0.02, 0.05, 0.04))} rotation={[0.55, Math.PI + 0.1, 0]}>
            <mesh geometry={phoneGeo} material={mats.dark} />
            <mesh position={[0, 0, 0.0075]}>
              <planeGeometry args={[0.07, 0.145]} />
              <meshBasicMaterial map={(screens[scr] as THREE.Texture) ?? undefined} toneMapped={false} />
            </mesh>
          </group>
        ) : null}
        {/* coffee cup in the left hand */}
        {has('cup') && frame >= (at('cup') as number) ? (
          <group position={Lf.H.clone().add(new THREE.Vector3(0, 0.07, 0.03))}>
            <mesh material={mats.cup}>
              <cylinderGeometry args={[0.042, 0.032, 0.13, 16]} />
            </mesh>
            <mesh material={mats.lid} position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
            </mesh>
            {sourS >= 0
              ? [0, 1, 2].map((k) => {
                  const t = ((sourS + k * 12) % 36) / 36;
                  return (
                    <mesh key={k} material={mats.sour} position={[(k - 1) * 0.04 + 0.02 * Math.sin(t * 8), 0.1 + t * 0.32, 0]} scale={[1, 1 - t, 1]}>
                      <torusGeometry args={[0.025, 0.006, 6, 12, Math.PI]} />
                    </mesh>
                  );
                })
              : null}
          </group>
        ) : null}
        {/* pending / paid ring over her head */}
        {ringOn > 0 ? (
          <mesh material={pend ? mats.ringAmber : mats.ringGreen} position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, pend ? frame / 8 : 0]} scale={ringOn}>
            <torusGeometry args={[0.16, 0.022, 8, 28, pend ? Math.PI * 1.5 : Math.PI * 2]} />
          </mesh>
        ) : null}
      </group>
      {/* the phrase card slips out and blows into the drain */}
      {dropS >= 0
        ? (() => {
            const t = clamp01(dropS / 54);
            const start = new THREE.Vector3(posAt(at('drop') as number) + 0.0, 0.95, z0 + 0.15);
            const end = new THREE.Vector3(17.6, 0.01, 1.45);
            const pos = start.clone().lerp(end, Easing.inOut(Easing.quad)(t));
            pos.y = lerp(0.95, 0.01, Easing.in(Easing.quad)(t)) + Math.sin(t * Math.PI * 3) * 0.12 * (1 - t);
            const vanish = 1 - clamp01((dropS - 58) / 10);
            return vanish > 0 ? (
              <mesh position={pos} rotation={[-Math.PI / 2 + Math.sin(dropS / 4) * 0.9 * (1 - t), dropS / 7, Math.sin(dropS / 5) * 0.6]} scale={vanish}>
                <planeGeometry args={[0.32, 0.22]} />
                <meshStandardMaterial map={phrase ?? undefined} side={THREE.DoubleSide} roughness={0.9} emissive={new THREE.Color('#ffffff')} emissiveIntensity={0.15} />
              </mesh>
            ) : null;
          })()
        : null}
    </Studio>
  );
};

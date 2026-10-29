import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {BlobShadow, Caption, Studio, Tags, canvasTex, clamp01, rand, useCamera, useClock, type Cam, type Tag} from './kit';
import {LaptopDrive, useWood} from './Drives3D';

/**
 * Character3D — a stylised "designer toy" person (big round head, mitten hands, hoodie): a stand-in for a real person in a
 * story, never a likeness. Arms are two-bone IK chains, so every pose is just where the hands go.
 *
 * actions (one per beat):
 *   enter      walks in from the left and turns to camera
 *   wave       waves (right hand), then drops back to the previous pose
 *   card       name card appears (props.card)
 *   type       typing at the laptop (use with desk)
 *   coins      coins start popping out of the laptop onto a pile; `count` (optional) is the beat the pile and counter finish
 *   hold       holds a hard drive in front of the chest     two   holds up a drive in each hand
 *   facepalm   hand to forehead, head down                  shrug palms up
 *   look       head turns to props.look ("left" | "right" | "down")       idle  back to standing
 *   label:<n>  show tag n        cam   (no-op beat for cam[])
 * props: card {name, role, note}, desk (desk + laptop), counter {to, suffix, y}, pose (starting pose), x, turn (root y
 * rotation), look, colours {top, legs, skin, hair}, tags, caption, cam
 */
type V3 = [number, number, number];
type Pose = {
  rh: V3; lh: V3; // hand targets (character space; r = character's right, on the −x side)
  rp: V3; lp: V3; // elbow pole hints
  head: V3; // nod (down +), turn, tilt
  torso: V3; // lean (fwd +), turn, side
  legs: [number, number];
  shrug: number;
  smile: number; // −1 frown … 1 smile
  open: number; // mouth open
  brow: number; // −1 worried … 1 raised
};
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  card?: {name: string; role?: string; note?: string; y?: number};
  desk?: boolean;
  counter?: {to: number; suffix?: string; x?: number; y?: number; size?: number};
  pose?: string;
  x?: number;
  turn?: number;
  look?: 'left' | 'right' | 'down';
  colours?: {top?: string; legs?: string; skin?: string; hair?: string};
};

const L1 = 0.5;
const L2 = 0.5;
const SHOULDER: V3 = [0.55, 0.8, 0]; // relative to the waist pivot
const WAIST_Y = 0.86;
const FLOOR = -1.35;

const idle = (f: number): Pose => ({
  rh: [-0.68, 0.74 + 0.01 * Math.sin(f / 14), 0.1],
  lh: [0.68, 0.74 + 0.01 * Math.sin(f / 14 + 1), 0.1],
  rp: [-1.4, 1.2, -0.8],
  lp: [1.4, 1.2, -0.8],
  head: [0.02 * Math.sin(f / 37), 0.06 * Math.sin(f / 53), 0.03 * Math.sin(f / 41)],
  torso: [0, 0.03 * Math.sin(f / 61), 0],
  legs: [0, 0],
  shrug: 0,
  smile: 0.7,
  open: 0,
  brow: 0,
});

const POSES: Record<string, (f: number) => Pose> = {
  idle,
  wave: (f) => ({
    ...idle(f),
    rh: [-0.84 + 0.12 * Math.sin(f / 3.2), 2.2, 0.3],
    rp: [-1.6, 1.0, -0.2],
    head: [0, -0.12, -0.08],
    smile: 1,
    open: 0.35,
    brow: 0.5,
  }),
  type: (f) => ({
    ...idle(f),
    rh: [-0.24 + 0.02 * Math.sin(f / 2.1), 1.2 + 0.035 * Math.max(0, Math.sin(f / 2.6)), 0.74],
    lh: [0.24 + 0.02 * Math.sin(f / 2.4 + 2), 1.2 + 0.035 * Math.max(0, Math.sin(f / 2.3 + 1.4)), 0.74],
    rp: [-1.1, 0.9, 0.1],
    lp: [1.1, 0.9, 0.1],
    head: [0.22, 0.05 * Math.sin(f / 30), 0],
    torso: [0.08, 0, 0],
    smile: 0.55,
    brow: 0.2,
  }),
  hold: (f) => ({
    ...idle(f),
    rh: [-0.22, 1.42, 0.66],
    lh: [0.22, 1.42, 0.66],
    rp: [-1.2, 0.8, 0.0],
    lp: [1.2, 0.8, 0.0],
    head: [0.12, 0, 0],
    smile: 0.5,
  }),
  two: (f) => ({
    ...idle(f),
    rh: [-0.86, 1.62, 0.5],
    lh: [0.86, 1.62, 0.5],
    rp: [-1.4, 0.8, -0.3],
    lp: [1.4, 0.8, -0.3],
    head: [0.05, 0.12 * Math.sin(f / 22), 0.06],
    smile: 0.3,
    brow: 0.4,
  }),
  facepalm: (f) => ({
    ...idle(f),
    rh: [-0.06, 2.24, 0.74],
    rp: [-0.9, 1.2, 0.9],
    lh: [0.7, 0.8, 0.14],
    head: [0.32, 0.05, 0.08 + 0.03 * Math.sin(f / 9)],
    torso: [0.06, 0.05, 0],
    smile: -0.8,
    open: 0,
    brow: -1,
  }),
  shrug: (f) => ({
    ...idle(f),
    rh: [-1.0, 1.24, 0.4],
    lh: [1.0, 1.24, 0.4],
    rp: [-1.0, 0.5, -0.4],
    lp: [1.0, 0.5, -0.4],
    head: [0, 0, 0.16],
    shrug: 1,
    smile: -0.15,
    open: 0.15,
    brow: 0.9,
  }),
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  rh: lerp3(a.rh, b.rh, t),
  lh: lerp3(a.lh, b.lh, t),
  rp: lerp3(a.rp, b.rp, t),
  lp: lerp3(a.lp, b.lp, t),
  head: lerp3(a.head, b.head, t),
  torso: lerp3(a.torso, b.torso, t),
  legs: [lerp(a.legs[0], b.legs[0], t), lerp(a.legs[1], b.legs[1], t)],
  shrug: lerp(a.shrug, b.shrug, t),
  smile: lerp(a.smile, b.smile, t),
  open: lerp(a.open, b.open, t),
  brow: lerp(a.brow, b.brow, t),
});

const V = (a: V3) => new THREE.Vector3(...a);
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

/** Two-bone IK: shoulder S, hand target H, elbow pole hint → elbow E and the reachable hand position. */
const solveArm = (S: THREE.Vector3, H: THREE.Vector3, pole: THREE.Vector3) => {
  const d = H.clone().sub(S);
  const dist = THREE.MathUtils.clamp(d.length(), 0.08, L1 + L2 - 0.002);
  const dir = d.normalize();
  const cosA = THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
  const a = Math.acos(cosA);
  const pv = pole.clone().sub(S);
  pv.sub(dir.clone().multiplyScalar(pv.dot(dir)));
  if (pv.lengthSq() < 1e-6) pv.set(0, 0, -1);
  pv.normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(L1 * Math.cos(a))).add(pv.multiplyScalar(L1 * Math.sin(a)));
  const Hn = S.clone().add(dir.clone().multiplyScalar(dist));
  return {E, H: Hn};
};

/** capsule between two points */
const Bone: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r: number; mat: THREE.Material}> = ({a, b, r, mat}) => {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <mesh material={mat} position={mid} quaternion={q}>
      <capsuleGeometry args={[r, Math.max(0.01, len - r * 0.6), 6, 16]} />
    </mesh>
  );
};

const coinFace = () =>
  canvasTex(256, 256, (g) => {
    const grd = g.createRadialGradient(100, 90, 10, 128, 128, 128);
    grd.addColorStop(0, '#FFE08A');
    grd.addColorStop(1, '#C27A12');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#FFD36A';
    g.lineWidth = 14;
    g.beginPath();
    g.arc(128, 128, 108, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#8A4E06';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 150px Inter, "DejaVu Sans", Arial, sans-serif';
    g.fillText('₿', 134, 142);
    g.fillStyle = '#FFE7A0';
    g.fillText('₿', 128, 136);
  });

const NameCard: React.FC<{p: number; name: string; role?: string; note?: string; y?: number}> = ({p, name, role, note, y = 1300}) => (
  <div style={{position: 'absolute', left: 80, width: 800, top: y, opacity: clamp01(p * 1.5), transform: `translateY(${(1 - p) * 34}px)`, fontFamily: theme.font}}>
    <div style={{display: 'flex', gap: 24, alignItems: 'stretch', background: 'rgba(9,13,22,0.82)', border: '1.5px solid rgba(255,255,255,0.16)', borderRadius: 24, padding: '24px 30px', boxShadow: '0 18px 50px rgba(0,0,0,0.45)'}}>
      <div style={{width: 9, borderRadius: 5, background: '#FFB547', transform: `scaleY(${clamp01(p * 1.3)})`, transformOrigin: 'top'}} />
      <div>
        <div style={{fontSize: 62, fontWeight: 800, color: '#ffffff', letterSpacing: 1.5, lineHeight: 1.05}}>{name}</div>
        {role ? <div style={{fontSize: 33, fontWeight: 600, color: 'rgba(255,255,255,0.78)', marginTop: 10}}>{role}</div> : null}
        {note ? <div style={{fontSize: 21, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 12, letterSpacing: 2.5, textTransform: 'uppercase'}}>{note}</div> : null}
      </div>
    </div>
  </div>
);

const POSE_ACTS = ['wave', 'type', 'hold', 'two', 'facepalm', 'shrug', 'idle'];

export const Character3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, at, p, since, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 0.75, 7.4], look: [0, 0.3, 0], fov: 30});
  const col = {top: '#3b78dd', legs: '#2a303c', skin: '#e7b08a', hair: '#3a281d', ...(props.colours ?? {})};

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshPhysicalMaterial({color: col.skin, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45}),
      hair: new THREE.MeshStandardMaterial({color: col.hair, roughness: 0.75}),
      top: new THREE.MeshStandardMaterial({color: col.top, roughness: 0.78}),
      topDark: new THREE.MeshStandardMaterial({color: new THREE.Color(col.top).multiplyScalar(0.72), roughness: 0.82}),
      legs: new THREE.MeshStandardMaterial({color: col.legs, roughness: 0.85}),
      shoe: new THREE.MeshStandardMaterial({color: '#e9ecef', roughness: 0.55}),
      sole: new THREE.MeshStandardMaterial({color: '#b9c0c9', roughness: 0.7}),
      eye: new THREE.MeshPhysicalMaterial({color: '#121418', roughness: 0.15, clearcoat: 1}),
      white: new THREE.MeshBasicMaterial({color: '#ffffff'}),
      mouth: new THREE.MeshStandardMaterial({color: '#5a2420', roughness: 0.6}),
      cheek: new THREE.MeshBasicMaterial({color: '#ff8a80', transparent: true, opacity: 0.28, depthWrite: false}),
      string: new THREE.MeshStandardMaterial({color: '#9aa4b2', roughness: 0.8}),
    }),
    [col.skin, col.hair, col.top, col.legs],
  );
  const torsoGeo = useMemo(() => new RoundedBoxGeometry(0.96, 1.0, 0.62, 5, 0.27), []);
  const hipGeo = useMemo(() => new RoundedBoxGeometry(0.84, 0.32, 0.56, 4, 0.14), []);
  const pocketGeo = useMemo(() => new RoundedBoxGeometry(0.56, 0.26, 0.06, 3, 0.03), []);
  const shoeGeo = useMemo(() => new RoundedBoxGeometry(0.26, 0.14, 0.44, 4, 0.065), []);

  // ---- pose track ----
  let pose = (POSES[props.pose ?? (props.desk ? 'type' : 'idle')] ?? idle)(frame);
  acts.forEach((a) => {
    if (!POSE_ACTS.includes(a)) return;
    const f0 = at(a);
    if (f0 === null || frame < f0) return;
    let w = interpolate(frame, [f0, f0 + 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    if (a === 'wave') w *= 1 - interpolate(frame, [f0 + 52, f0 + 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    pose = lerpPose(pose, POSES[a](frame), w);
  });
  if (has('look')) {
    const w = p('look', 14);
    const target: V3 = props.look === 'left' ? [0.05, -0.55, 0] : props.look === 'down' ? [0.45, 0, 0] : [0.05, 0.55, 0];
    pose = {...pose, head: lerp3(pose.head, target, w)};
  }

  // ---- walk in ----
  const x0 = props.x ?? 0;
  const walkP = has('enter') ? p('enter', 34, Easing.out(Easing.quad)) : 1;
  const turnP = has('enter') ? interpolate(since('enter'), [26, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 1;
  const walking = has('enter') ? (1 - turnP) * (since('enter') >= 0 ? 1 : 1) : 0;
  const rootX = lerp(x0 - 3.2, x0, walkP);
  const rootRot = lerp(Math.PI / 2, props.turn ?? 0, turnP);
  const phase = frame / 3.1;
  const sw = Math.sin(phase) * walking;
  if (walking > 0) {
    pose = {
      ...pose,
      legs: [0.5 * sw, -0.5 * sw],
      rh: [pose.rh[0], pose.rh[1], pose.rh[2] - 0.3 * sw],
      lh: [pose.lh[0], pose.lh[1], pose.lh[2] + 0.3 * sw],
    };
  }
  const bob = Math.abs(Math.sin(phase)) * 0.05 * walking;

  // ---- skeleton (character space, feet at y = 0) ----
  const torsoEuler = new THREE.Euler(pose.torso[0], pose.torso[1], pose.torso[2]);
  const waist = new THREE.Vector3(0, WAIST_Y + bob, 0);
  const shoulderOf = (s: number) => new THREE.Vector3(s * SHOULDER[0], SHOULDER[1] + 0.07 * pose.shrug, SHOULDER[2]).applyEuler(torsoEuler).add(waist);
  const Sr = shoulderOf(-1);
  const Sl = shoulderOf(1);
  const R = solveArm(Sr, V(pose.rh), V(pose.rp));
  const Lf = solveArm(Sl, V(pose.lh), V(pose.lp));
  const breathe = 1 + 0.012 * Math.sin(frame / 14);

  // ---- face ----
  const blink = (frame + 23) % 96 < 4 ? 0.12 : 1;
  const smile = pose.smile;
  const mouthRot = smile >= 0 ? Math.PI : 0;
  const mouthSY = Math.max(0.18, Math.abs(smile));
  const browY = 0.16 + 0.05 * Math.max(0, pose.brow);
  const browRot = pose.brow < 0 ? -pose.brow * 0.38 : 0;

  // legs
  const hipOf = (s: number) => new THREE.Vector3(s * 0.2, WAIST_Y - 0.06 + bob, 0);
  const ankleOf = (s: number, a: number) => hipOf(s).add(new THREE.Vector3(0, -0.66 * Math.cos(a), 0.66 * Math.sin(a)));

  // ---- desk + laptop + coins ----
  const deskTop = 1.04;
  const coinTex = useMemo(() => coinFace(), []);
  const coinMats = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({color: '#E0A33A', metalness: 1, roughness: 0.28});
    const face = new THREE.MeshPhysicalMaterial({map: coinTex ?? undefined, metalness: 0.85, roughness: 0.3});
    return [side, face, face];
  }, [coinTex]);
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.1, 0.026, 36), []);
  const NC = 44;
  const pile = useMemo(
    () =>
      Array.from({length: NC}).map((_, i) => {
        const h = Math.floor(i / 7);
        const rr = (0.24 - h * 0.035) * Math.sqrt(rand(i + 3));
        const a = rand(i + 9) * Math.PI * 2;
        return {x: 1.02 + Math.cos(a) * rr, y: deskTop + 0.016 + h * 0.026 + rand(i) * 0.008, z: 0.92 + Math.sin(a) * rr * 0.8, rx: (rand(i + 1) - 0.5) * 0.35, rz: (rand(i + 2) - 0.5) * 0.35};
      }),
    [],
  );
  const cStart = at('coins');
  const cEnd = at('count');
  const cDur = cStart !== null && cEnd !== null && cEnd > cStart ? cEnd - cStart : 96;
  const coinsS = since('coins');
  const coinProg = coinsS < 0 ? 0 : clamp01(coinsS / cDur);
  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#0b1a2a', emissive: new THREE.Color('#2a9df4'), emissiveIntensity: 0.6, roughness: 0.3}), []);
  const flash = coinsS >= 0 && coinProg < 1 ? 0.5 + 0.5 * Math.sin(coinsS * 0.9) : 0;
  screenMat.emissiveIntensity = 0.55 + 0.6 * flash;
  const lidMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#59606b', metalness: 0.9, roughness: 0.35}), []);
  const keysTex = useMemo(
    () =>
      canvasTex(512, 340, (g) => {
        g.fillStyle = '#1b1e23';
        g.fillRect(0, 0, 512, 340);
        g.fillStyle = '#2c3038';
        for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) g.fillRect(14 + c * 37.5, 14 + r * 40, 31, 32);
        g.fillRect(120, 214, 270, 32);
        g.fillStyle = '#23262c';
        g.fillRect(170, 262, 170, 70);
      }),
    [],
  );
  const floorTex = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        const grd = g.createRadialGradient(256, 256, 0, 256, 256, 256);
        grd.addColorStop(0, 'rgba(32,44,68,1)');
        grd.addColorStop(0.35, 'rgba(22,31,50,0.9)');
        grd.addColorStop(1, 'rgba(7,11,18,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 512, 512);
      }),
    [],
  );
  const wood = useWood();
  const deskMat = useMemo(() => new THREE.MeshStandardMaterial({map: wood.dark ?? undefined, roughness: 0.6}), [wood]);
  const deskFront = useMemo(() => new THREE.MeshStandardMaterial({map: wood.dark ?? undefined, color: '#c9b8a8', roughness: 0.7}), [wood]);

  // held drives
  const holdW = has('hold') ? p('hold', 14) : 0;
  const twoW = has('two') ? p('two', 14) : 0;

  // ---- overlay ----
  const cardP = p('card', 14, Easing.out(Easing.cubic));
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const countVal = props.counter ? Math.round(props.counter.to * Easing.out(Easing.quad)(coinProg)) : 0;
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.card && cardP > 0 ? <NameCard p={cardP} {...props.card} /> : null}
      {props.counter && coinsS >= 0 ? (
        <div style={{position: 'absolute', left: (props.counter.x ?? 540) - 300, width: 600, top: props.counter.y ?? 520, textAlign: 'center', fontFamily: theme.font, fontWeight: 800, fontSize: props.counter.size ?? 96, color: '#F2C45A', letterSpacing: -2, fontVariantNumeric: 'tabular-nums', textShadow: '0 4px 28px rgba(0,0,0,0.85)', opacity: clamp01(coinsS / 6)}}>
          {countVal.toLocaleString('en-US')}
          <span style={{fontSize: (props.counter.size ?? 96) * 0.5, marginLeft: 14, color: '#ffffff'}}>{props.counter.suffix ?? 'BTC'}</span>
        </div>
      ) : null}
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.8}>
      <fog attach="fog" args={['#0b1220', 9, 22]} />
      <mesh position={[0, FLOOR - 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial map={floorTex ?? undefined} roughness={0.95} transparent />
      </mesh>
      {props.desk ? <pointLight position={[0, FLOOR + 1.55, 0.7]} intensity={0.9 + 0.7 * flash} distance={2.4} color="#9fd4ff" /> : null}
      <group position={[rootX, FLOOR, 0]} rotation={[0, rootRot, 0]}>
        <BlobShadow w={1.5} d={1.0} opacity={0.6} position={[0, 0.004, 0.05]} />
        {/* legs + shoes */}
        {[-1, 1].map((s, i) => {
          const a = pose.legs[i];
          const hip = hipOf(s);
          const ankle = ankleOf(s, a);
          return (
            <group key={s}>
              <Bone a={hip} b={ankle} r={0.135} mat={mats.legs} />
              <group position={[ankle.x, ankle.y - 0.06, ankle.z + 0.06]} rotation={[-a * 0.6, 0, 0]}>
                <mesh geometry={shoeGeo} material={mats.shoe} />
                <mesh material={mats.sole} position={[0, -0.06, 0]}>
                  <boxGeometry args={[0.25, 0.03, 0.43]} />
                </mesh>
              </group>
            </group>
          );
        })}
        <mesh geometry={hipGeo} material={mats.legs} position={[0, WAIST_Y + bob, 0]} />
        {/* torso (rotates about the waist) */}
        <group position={waist} rotation={torsoEuler}>
          <group scale={[1, breathe, 1]}>
            <mesh geometry={torsoGeo} material={mats.top} position={[0, 0.44, 0]} />
            <mesh geometry={pocketGeo} material={mats.topDark} position={[0, 0.16, 0.3]} />
            {/* hood */}
            <mesh material={mats.topDark} position={[0, 0.92, -0.1]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
              <torusGeometry args={[0.24, 0.1, 12, 32]} />
            </mesh>
            {[-0.09, 0.09].map((x, i) => (
              <mesh key={i} material={mats.string} position={[x, 0.74, 0.315]}>
                <cylinderGeometry args={[0.011, 0.011, 0.2, 8]} />
              </mesh>
            ))}
          </group>
          {/* neck + head */}
          <mesh material={mats.skin} position={[0, 0.98, 0]}>
            <cylinderGeometry args={[0.11, 0.12, 0.16, 20]} />
          </mesh>
          <group position={[0, 1.02 + 0.01 * Math.sin(frame / 14), 0]} rotation={pose.head}>
            <group position={[0, 0.45, 0]}>
              <mesh material={mats.skin} scale={[1, 0.95, 0.96]}>
                <sphereGeometry args={[0.5, 48, 36]} />
              </mesh>
              {/* ears */}
              {[-1, 1].map((s) => (
                <mesh key={s} material={mats.skin} position={[s * 0.485, 0.0, -0.02]} scale={[0.55, 1, 0.8]}>
                  <sphereGeometry args={[0.1, 16, 12]} />
                </mesh>
              ))}
              {/* hair: crown + back/sides shell + fringe tufts (scaled like the head) */}
              <group scale={[1, 0.95, 0.96]}>
                <mesh material={mats.hair}>
                  <sphereGeometry args={[0.532, 48, 14, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
                </mesh>
                <mesh material={mats.hair}>
                  <sphereGeometry args={[0.53, 48, 10, Math.PI * 0.5 + 1.05, Math.PI * 2 - 2.1, Math.PI * 0.3 - 0.02, Math.PI * 0.2 + 0.02]} />
                </mesh>
                <mesh material={mats.hair}>
                  <sphereGeometry args={[0.528, 32, 10, Math.PI * 1.5 - 1.0, 2.0, Math.PI * 0.5 - 0.02, Math.PI * 0.2]} />
                </mesh>
                {[
                  [-0.5, 0.17, 0.14, 0.62],
                  [-0.12, 0.2, 0.15, 0.6],
                  [0.28, 0.16, 0.13, 0.66],
                ].map(([az, sx, sz, el], i) => (
                  <group key={i} rotation={[0, az, 0]}>
                    <mesh material={mats.hair} position={[0, 0.535 * Math.sin(el), 0.535 * Math.cos(el)]} rotation={[Math.PI / 2 - el, 0, i === 1 ? -0.25 : 0.15]} scale={[sx, 0.07, sz]}>
                      <sphereGeometry args={[1, 24, 12]} />
                    </mesh>
                  </group>
                ))}
              </group>
              {/* eyes */}
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.17, 0.04, 0.44]}>
                  <mesh material={mats.eye} scale={[0.82, 1.18 * blink, 0.5]}>
                    <sphereGeometry args={[0.066, 20, 16]} />
                  </mesh>
                  {blink > 0.5 ? (
                    <mesh material={mats.white} position={[0.02, 0.03, 0.03]}>
                      <sphereGeometry args={[0.017, 10, 8]} />
                    </mesh>
                  ) : null}
                  {/* brow */}
                  <mesh material={mats.hair} position={[0, browY, 0.02]} rotation={[0, 0, Math.PI / 2 + s * -browRot]}>
                    <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
                  </mesh>
                </group>
              ))}
              {/* brows are capsules lying along x */}
              {/* nose */}
              <mesh material={mats.skin} position={[0, -0.05, 0.49]} scale={[1, 0.85, 0.8]}>
                <sphereGeometry args={[0.05, 16, 12]} />
              </mesh>
              {/* cheeks */}
              {[-1, 1].map((s) => (
                <mesh key={s} material={mats.cheek} position={[s * 0.27, -0.1, 0.415]} rotation={[0, s * 0.55, 0]}>
                  <circleGeometry args={[0.07, 20]} />
                </mesh>
              ))}
              {/* mouth */}
              <group position={[0, -0.19, 0.468]} rotation={[-0.25, 0, 0]}>
                <mesh material={mats.mouth} rotation={[0, 0, mouthRot]} scale={[1, mouthSY, 1]} position={[0, smile >= 0 ? 0.03 : -0.03, 0]}>
                  <torusGeometry args={[0.08, 0.017, 8, 24, Math.PI]} />
                </mesh>
                {pose.open > 0.02 ? (
                  <mesh material={mats.mouth} position={[0, -0.02, 0]} scale={[1.1, pose.open, 0.4]}>
                    <sphereGeometry args={[0.06, 16, 12]} />
                  </mesh>
                ) : null}
              </group>
            </group>
          </group>
        </group>
        {/* arms (character space) */}
        {[
          {S: Sr, A: R},
          {S: Sl, A: Lf},
        ].map(({S, A}, i) => (
          <group key={i}>
            <mesh material={mats.top} position={S}>
              <sphereGeometry args={[0.135, 20, 16]} />
            </mesh>
            <Bone a={S} b={A.E} r={0.12} mat={mats.top} />
            <mesh material={mats.top} position={A.E}>
              <sphereGeometry args={[0.115, 16, 12]} />
            </mesh>
            <Bone a={A.E} b={A.H} r={0.108} mat={mats.top} />
            <mesh material={mats.skin} position={A.H.clone().add(A.H.clone().sub(A.E).normalize().multiplyScalar(0.06))}>
              <sphereGeometry args={[0.13, 20, 16]} />
            </mesh>
          </group>
        ))}
        {/* held drives */}
        {holdW > 0.05 ? (
          <group position={R.H.clone().add(Lf.H).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.12, 0.12))} rotation={[1.25, 0, 0]} scale={0.55 * holdW}>
            <LaptopDrive glow={0.6} />
          </group>
        ) : null}
        {twoW > 0.05
          ? [R.H, Lf.H].map((h, i) => (
              <group key={i} position={h.clone().add(new THREE.Vector3(0, 0.26, 0.12))} rotation={[1.35, 0, (i ? -1 : 1) * 0.12]} scale={0.5 * twoW}>
                <LaptopDrive />
              </group>
            ))
          : null}
        {/* desk with a laptop */}
        {props.desk ? (
          <group>
            <mesh material={deskMat} position={[0, deskTop - 0.04, 0.9]}>
              <boxGeometry args={[2.7, 0.08, 1.05]} />
            </mesh>
            <mesh material={deskFront} position={[0, deskTop * 0.5 - 0.04, 1.4]}>
              <boxGeometry args={[2.62, deskTop, 0.05]} />
            </mesh>
            {[-1.28, 1.28].map((x, i) => (
              <mesh key={i} material={deskFront} position={[x, deskTop * 0.5 - 0.04, 0.9]}>
                <boxGeometry args={[0.06, deskTop, 1.0]} />
              </mesh>
            ))}
            {/* laptop base */}
            <group position={[0, deskTop + 0.018, 0.78]}>
              <mesh material={lidMat}>
                <boxGeometry args={[0.92, 0.035, 0.6]} />
              </mesh>
              <mesh position={[0, 0.018, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.84, 0.5]} />
                <meshStandardMaterial map={keysTex ?? undefined} roughness={0.6} />
              </mesh>
              {/* lid (hinged at the far edge, screen facing the character) */}
              <group position={[0, 0.018, 0.3]} rotation={[0.2, 0, 0]}>
                <mesh material={lidMat} position={[0, 0.3, 0.012]}>
                  <boxGeometry args={[0.92, 0.6, 0.024]} />
                </mesh>
                <mesh material={screenMat} position={[0, 0.3, -0.001]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[0.84, 0.52]} />
                </mesh>
              </group>
            </group>
            {/* coins */}
            {coinsS >= 0
              ? pile.map((c, i) => {
                  const t0 = (i / NC) * cDur * 0.92;
                  const t = interpolate(coinsS - t0, [0, 13], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
                  if (coinsS - t0 < 0) return null;
                  const from = new THREE.Vector3(0.34, deskTop + 0.6, 1.1);
                  const pos = from.clone().lerp(new THREE.Vector3(c.x, c.y, c.z), t);
                  pos.y += Math.sin(t * Math.PI) * 0.32;
                  return <mesh key={i} geometry={coinGeo} material={coinMats} position={pos} rotation={[c.rx + (1 - t) * 6, (1 - t) * 3, c.rz]} />;
                })
              : null}
          </group>
        ) : null}
      </group>
    </Studio>
  );
};

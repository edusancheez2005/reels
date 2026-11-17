import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {VRM, VRMLoaderPlugin, VRMUtils} from '@pixiv/three-vrm';
import {EffectComposer, Bloom, Vignette} from '@react-three/postprocessing';
import {LEAD_FRAMES, revealFrame, type SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {CANVAS, Caption, Tags, canvasTex, clamp01, useCamera, type Cam, type Tag} from './kit';

/**
 * Actor3D (17 Nov 2026, the "genius" skit; Edu: "a proper 3D person... have those characters instead of the other ones").
 * Real rigged characters with faces (VRM files, CC0, from the 100Avatars collection; see public/models/README.md), posed by
 * inverse kinematics from named poses, on a simple coloured set or at a desk with a monitor. Everything is a pure function of
 * the frame, so Remotion can render frames in any order.
 *
 * World: an actor at `at` (default the origin) faces +z, towards the usual cameras; his left is +x. Floor y = 0. The desk
 * (set: "desk") stands in front of the origin (z ≈ 0.4–1.0, top y 0.74) with the monitor facing the actor.
 * Cameras (absolute, cam[]), for an actor about 1.75 m tall at the origin:
 *   full body             {pos: [0.6, 1.15, 4.7], look: [0, 0.9, 0], fov: 28}
 *   waist up              {pos: [0.5, 1.42, 2.5], look: [0, 1.28, 0], fov: 28}
 *   face over the monitor {pos: [0.3, 1.52, 2.35], look: [0, 1.5, 0], fov: 30}       (desk set)
 *   first person, screen  {pos: [0, 1.4, 0.07], look: [0, 0.92, 0.82], fov: 74}, shift 60 (not further back: the tie gets in the way)  (desk set: his hands, keyboard and the
 *                         whole screen; a landscape monitor can't be read over a shoulder in a vertical frame)
 * actions (one per beat; "a+b" fires several on the same beat):
 *   <id>:<pose>      the actor snaps to a pose: relax | genius (finger to the temple) | panic (hands on head) | cheer | clap |
 *                    jump (jumping and clapping) | dance | proud (hands on hips) | type | click | point | shrug | think |
 *                    facepalm | slump | wave | lean | beg (hands together) | phone (a phone at his ear) | scroll (reading a
 *                    phone held in front of him)
 *   <id>:look:<deg>  turn the head (+ = to the actor's left)        <id>:in / <id>:out   pop into / drop out of frame
 *   <id>:talk:<sec>  the mouth moves for that long (a line tagged [id] in script.txt, voiced by cast.json)
 *   screen:<state>   the monitor switches to props.screens[state]   mood:<name>   day | teal | pink | night | doom (colours + light)
 *   stamp            slam props.stamp on screen      shake   camera shake
 *   label:<n> / hide:<n>   show / hide tag n         cam     (no-op beat for a camera keyframe)
 * props: actors [{id, model, at, yaw, tall, pose, hidden}], set ("studio" | "desk"), mood, screens {[state]: {head, big, sub,
 *   tone, chart}}, screen, screenTurn, cam, tags, stamp {text, x, y, size, tone, rot}, caption, shift (px the picture is pushed
 *   down to clear a caption at the top; default 230, use ~60 with "pill" captions)
 *   backdrop ("wall" | "sky"): "sky" takes the back wall away and puts a sky behind the floor (stars when the mood is dark),
 *     for anything outdoors.
 *   props [{shape, at, size, color, rot, glow}]: set dressing built from simple solids, so each story gets its own place
 *     (a judge's bench, a campfire, a bed, a bin, a moon) without new code. shape: box (size [w, h, d]) | cyl ([radius, height])
 *     | ball ([radius]) | cone ([radius, height]) | plane ([w, h], faces +z). at is the CENTRE of the solid in metres; rot is
 *     degrees [x, y, z]; glow > 0 makes it shine in its own colour (lamps, screens, the moon, fire).
 */
type V3 = [number, number, number];
type Tone = 'accent' | 'good' | 'alert' | 'warm' | 'muted' | 'white';
type ActorDef = {id: string; model: string; at?: V3; yaw?: number; tall?: number; pose?: string; hidden?: boolean; look?: number};
type ScreenState = {head?: string; big?: string; sub?: string; tone?: Tone; chart?: 'up' | 'down'};
type Mood = {wall: string; floor: string; key: number; fill: number; glow: string; glowI: number};
type PropDef = {shape: 'box' | 'cyl' | 'ball' | 'cone' | 'plane'; at: V3; size?: number[]; color?: string; rot?: V3; glow?: number};
type P = {
  actors: ActorDef[];
  actions?: string[];
  cam?: Cam[];
  set?: 'studio' | 'desk';
  backdrop?: 'wall' | 'sky';
  props?: PropDef[];
  mood?: string;
  screens?: Record<string, ScreenState>;
  screen?: string;
  screenTurn?: number;
  tags?: Tag[];
  stamp?: {text: string; x?: number; y?: number; size?: number; tone?: Tone; rot?: number};
  caption?: string;
  shift?: number;
};

const TONE: Record<Tone, string> = {accent: '#3bc9ee', good: '#3ddc84', alert: '#ff5a4e', warm: '#ffc531', muted: '#8595a8', white: '#ffffff'};
const MOODS: Record<string, Mood> = {
  day: {wall: '#f2b84b', floor: '#eadfcd', key: 2.3, fill: 1.15, glow: '#7fb0ff', glowI: 0.0},
  teal: {wall: '#2fb7a3', floor: '#dff3ee', key: 2.3, fill: 1.15, glow: '#7fb0ff', glowI: 0.0},
  pink: {wall: '#ff7aa8', floor: '#ffe6ee', key: 2.3, fill: 1.15, glow: '#7fb0ff', glowI: 0.0},
  blue: {wall: '#3b6cf6', floor: '#dfe7ff', key: 2.3, fill: 1.15, glow: '#7fb0ff', glowI: 0.0},
  night: {wall: '#1b2238', floor: '#262b3a', key: 0.55, fill: 0.5, glow: '#5fa8ff', glowI: 2.0},
  doom: {wall: '#2a1218', floor: '#241a22', key: 0.4, fill: 0.42, glow: '#ff3b30', glowI: 3.0},
};

/** Per-model measurements (model units): height of the top of the head, head bone → head centre, head radius. */
const MODELS: Record<string, {top: number; headUp: number; headR: number}> = {
  'Bizdude.vrm': {top: 2.01, headUp: 0.1, headR: 0.2},
  'StonksReporter.vrm': {top: 2.0, headUp: 0.125, headR: 0.19},
};

// ---------- loading ----------
const useVRM = (file: string): {vrm: VRM | null; handle: number} => {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [handle] = useState(() => delayRender(`Actor3D: loading ${file}`, {timeoutInMilliseconds: 180000}));
  useEffect(() => {
    let alive = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      staticFile(`models/${file}`),
      (gltf) => {
        if (!alive) return;
        const v = gltf.userData.vrm as VRM;
        VRMUtils.rotateVRM0(v);
        const box = new THREE.Box3().setFromObject(v.scene);
        v.scene.userData.top = MODELS[file]?.top ?? box.max.y - box.min.y;
        v.scene.userData.headR = MODELS[file]?.headR ?? 0.13;
        v.scene.userData.headUp = MODELS[file]?.headUp ?? 0.09;
        v.scene.traverse((o) => {
          o.frustumCulled = false;
          const m = o as THREE.Mesh;
          if (m.isMesh) m.castShadow = true;
        });
        setVrm(v);
      },
      undefined,
      (e) => {
        console.error('Actor3D: could not load', file, String((e as Error)?.message ?? e));
        continueRender(handle);
      },
    );
    return () => {
      alive = false;
    };
  }, [file, handle]);
  return {vrm, handle};
};

// ---------- poses ----------
/** A hand target: an anchor on the body plus [out, up, forward] in metres (out = away from the body on that hand's side). */
type HandT = {a: 'head' | 'chest' | 'hips' | 'floor'; o: V3; p?: V3};
type PoseDef = {
  rh: HandT;
  lh: HandT;
  head?: V3; // pitch (+ down), yaw (+ to his left), roll (+ to his left shoulder), radians
  spine?: V3;
  expr?: Record<string, number>;
  rShape?: 'open' | 'fist' | 'point';
  lShape?: 'open' | 'fist' | 'point';
  bounce?: number; // 0..1 how much the body bobs
  hop?: number; // 0..1 how high he jumps, over and over
  item?: 'ear' | 'front'; // a phone in the right hand: at the ear, or held in front to read
};

const DOWN: V3 = [0.5, -1, -0.45];
const OUTP: V3 = [1, -0.25, -0.15];

const poseOf = (name: string, R: number, f: number, ph: number): PoseDef => {
  const relaxH: HandT = {a: 'hips', o: [0.3, -0.1, 0.03], p: DOWN};
  switch (name) {
    case 'genius':
      return {
        rh: {a: 'head', o: [R * 0.98, R * 0.05, R * 0.55], p: [1, -0.55, 0.1]},
        lh: {a: 'hips', o: [0.2, 0.13, 0.12], p: [1, -0.1, -0.6]},
        head: [-0.06, -0.2, 0.1],
        spine: [-0.03, 0, 0.03],
        expr: {happy: 1, relaxed: 0.4},
        rShape: 'point',
      };
    case 'proud':
      return {
        rh: {a: 'hips', o: [0.21, 0.1, 0.06], p: [1, -0.1, -0.7]},
        lh: {a: 'hips', o: [0.21, 0.1, 0.06], p: [1, -0.1, -0.7]},
        head: [-0.12, 0, 0],
        spine: [-0.06, 0, 0],
        expr: {happy: 1},
      };
    case 'panic':
      return {
        rh: {a: 'head', o: [R * 1.12, R * 0.15, 0.02], p: [1, -0.15, -0.1]},
        lh: {a: 'head', o: [R * 1.12, R * 0.15, 0.02], p: [1, -0.15, -0.1]},
        head: [0.1, 0, 0],
        spine: [0.05, 0, 0],
        expr: {aa: 1, sad: 0.8},
      };
    case 'cheer': {
      const b = Math.sin(f * 0.55 + ph);
      return {
        rh: {a: 'head', o: [0.36, 0.42 + 0.05 * b, 0.05], p: OUTP},
        lh: {a: 'head', o: [0.36, 0.42 - 0.05 * b, 0.05], p: OUTP},
        head: [-0.14, 0, 0.05 * b],
        expr: {happy: 1, aa: 0.5},
        bounce: 1,
      };
    }
    case 'clap': {
      const c = 0.5 + 0.5 * Math.sin(f * 1.25 + ph);
      return {
        rh: {a: 'chest', o: [0.015 + 0.1 * c, 0.07, 0.3], p: [1, -0.5, -0.2]},
        lh: {a: 'chest', o: [0.015 + 0.1 * c, 0.05, 0.3], p: [1, -0.5, -0.2]},
        head: [-0.05, 0, 0.04 * Math.sin(f * 0.3 + ph)],
        expr: {happy: 1, aa: 0.35},
        bounce: 0.5,
      };
    }
    case 'jump': {
      // jumping and clapping (Edu, 17 Nov 2026: "he's like jumping and clapping... I find that really funny")
      const c = 0.5 + 0.5 * Math.sin(f * 1.35 + ph);
      return {
        rh: {a: 'head', o: [0.07 + 0.2 * c, 0.34, 0.08], p: OUTP},
        lh: {a: 'head', o: [0.07 + 0.2 * c, 0.32, 0.08], p: OUTP},
        head: [-0.16, 0, 0.07 * Math.sin(f * 0.224 + ph)],
        spine: [-0.05, 0, 0],
        expr: {happy: 1, aa: 0.6},
        hop: 1,
      };
    }
    case 'dance': {
      const d = Math.sin(f * 0.224 + ph);
      return {
        rh: {a: 'head', o: [0.34, 0.12 + 0.24 * d, 0.1], p: OUTP},
        lh: {a: 'head', o: [0.34, 0.12 - 0.24 * d, 0.1], p: OUTP},
        head: [-0.08, 0.1 * d, 0.14 * d],
        spine: [0, 0.08 * d, 0.12 * d],
        expr: {happy: 1, aa: 0.3},
        rShape: 'fist',
        lShape: 'fist',
        hop: 0.4,
      };
    }
    case 'beg':
      return {
        // the hand carries on past the wrist, so the wrists stay apart and the fingertips meet under the chin
        rh: {a: 'chest', o: [0.19, 0.0, 0.24], p: [1, -0.5, -0.1]},
        lh: {a: 'chest', o: [0.19, 0.0, 0.24], p: [1, -0.5, -0.1]},
        head: [-0.2, 0, 0.06],
        spine: [0.06, 0, 0],
        expr: {sad: 1},
      };
    case 'phone':
      return {
        rh: {a: 'head', o: [R * 1.18, -R * 0.55, R * 0.1], p: [1, -0.7, -0.15]},
        lh: relaxH,
        head: [0, 0, -0.06],
        rShape: 'fist',
        item: 'ear',
      };
    case 'scroll':
      return {
        rh: {a: 'chest', o: [0.02, -0.02, 0.3], p: [1, -0.8, -0.1]},
        lh: relaxH,
        head: [0.34, 0, 0],
        spine: [0.06, 0, 0],
        rShape: 'fist',
        item: 'front',
      };
    case 'type': {
      const t = (s: number) => 0.012 * Math.sin(f * 1.45 + s * 2.1) + 0.006 * Math.sin(f * 3.1 + s);
      return {
        rh: {a: 'floor', o: [0.13, 0.81 + t(1), 0.5], p: DOWN},
        lh: {a: 'floor', o: [0.13, 0.81 + t(2), 0.5], p: DOWN},
        head: [0.2, 0, 0],
        spine: [0.12, 0, 0],
      };
    }
    case 'click':
      return {
        rh: {a: 'floor', o: [0.27, 0.8, 0.52], p: DOWN},
        lh: {a: 'floor', o: [0.13, 0.81, 0.48], p: DOWN},
        head: [0.2, -0.08, 0],
        spine: [0.12, 0, 0],
        rShape: 'point',
      };
    case 'lean':
      return {
        rh: {a: 'floor', o: [0.3, 0.78, 0.46], p: DOWN},
        lh: {a: 'floor', o: [0.3, 0.78, 0.46], p: DOWN},
        head: [0.12, 0, 0],
        spine: [0.3, 0, 0],
      };
    case 'point':
      return {rh: {a: 'chest', o: [0.05, 0.06, 0.62], p: [0.6, -1, 0]}, lh: relaxH, head: [0, 0, 0.05], rShape: 'point'};
    case 'shrug':
      return {
        rh: {a: 'chest', o: [0.42, -0.04, 0.2], p: [0.3, -1, -0.3]},
        lh: {a: 'chest', o: [0.42, -0.04, 0.2], p: [0.3, -1, -0.3]},
        head: [0, 0, 0.16],
        expr: {relaxed: 1},
      };
    case 'think':
      return {
        rh: {a: 'head', o: [0.03, -R * 1.05, R * 0.9], p: [0.7, -1, 0.2]},
        lh: {a: 'chest', o: [-0.1, -0.16, 0.2], p: [1, -0.6, -0.2]},
        head: [0.04, 0.12, 0.08],
        rShape: 'fist',
      };
    case 'facepalm':
      return {
        rh: {a: 'head', o: [0.0, -R * 0.8, R * 1.1], p: [1, -0.8, 0.3]},
        lh: relaxH,
        head: [0.3, 0, 0],
        spine: [0.14, 0, 0],
        expr: {sad: 1, blink: 1},
      };
    case 'slump':
      return {
        rh: {a: 'hips', o: [0.24, -0.2, 0.12], p: DOWN},
        lh: {a: 'hips', o: [0.24, -0.2, 0.12], p: DOWN},
        head: [0.55, 0, 0],
        spine: [0.3, 0, 0],
        expr: {sad: 1},
      };
    case 'wave': {
      const w = Math.sin(f * 0.6 + ph);
      return {rh: {a: 'head', o: [0.3 + 0.07 * w, 0.2, 0.08], p: OUTP}, lh: relaxH, head: [0, 0, 0.06], expr: {happy: 1}};
    }
    default:
      return {rh: relaxH, lh: relaxH};
  }
};

type Axes = {left: THREE.Vector3; up: THREE.Vector3; fwd: THREE.Vector3};
type Solved = {rh: THREE.Vector3; lh: THREE.Vector3; rp: THREE.Vector3; lp: THREE.Vector3; head: V3; spine: V3; expr: Record<string, number>; rFist: number; rPoint: number; lFist: number; lPoint: number; bounce: number; hop: number; item: string};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Rotate `bone` by a world-space rotation, keeping its children attached. */
const applyWorldRot = (bone: THREE.Object3D, qWorld: THREE.Quaternion) => {
  const pw = bone.parent ? bone.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
  bone.quaternion.copy(pw.clone().invert().multiply(qWorld).multiply(pw).multiply(bone.quaternion));
  bone.updateWorldMatrix(false, true);
};

const torsoQ = (r: V3, A: Axes) => {
  const q = new THREE.Quaternion().setFromAxisAngle(A.up, r[1]);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(A.left, r[0])); // about his left axis: + pitches the head forward/down
  q.multiply(new THREE.Quaternion().setFromAxisAngle(A.fwd, -r[2]));
  return q;
};

const solveArm = (vrm: VRM, side: 'left' | 'right', target: THREE.Vector3, pole: THREE.Vector3) => {
  const h = vrm.humanoid;
  const ua = h.getNormalizedBoneNode(`${side}UpperArm` as never);
  const la = h.getNormalizedBoneNode(`${side}LowerArm` as never);
  const hd = h.getNormalizedBoneNode(`${side}Hand` as never);
  if (!ua || !la || !hd) return;
  ua.updateWorldMatrix(true, true);
  const S = ua.getWorldPosition(new THREE.Vector3());
  const E0 = la.getWorldPosition(new THREE.Vector3());
  const H0 = hd.getWorldPosition(new THREE.Vector3());
  const a = S.distanceTo(E0);
  const b = E0.distanceTo(H0);
  const toT = target.clone().sub(S);
  const d = Math.max(Math.abs(a - b) + 0.01, Math.min((a + b) * 0.995, toT.length()));
  const dir = toT.normalize();
  const x = (a * a - b * b + d * d) / (2 * d);
  const hgt = Math.sqrt(Math.max(0, a * a - x * x));
  const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if (perp.lengthSq() < 1e-6) perp.set(0, -1, 0);
  perp.normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(x)).add(perp.multiplyScalar(hgt));
  const T = S.clone().add(dir.clone().multiplyScalar(d));
  applyWorldRot(ua, new THREE.Quaternion().setFromUnitVectors(E0.clone().sub(S).normalize(), E.clone().sub(S).normalize()));
  const E1 = la.getWorldPosition(new THREE.Vector3());
  const H1 = hd.getWorldPosition(new THREE.Vector3());
  applyWorldRot(la, new THREE.Quaternion().setFromUnitVectors(H1.sub(E1).normalize(), T.sub(E1).normalize()));
};

const FINGERS = ['Index', 'Middle', 'Ring', 'Little'];
const SEGS = ['Proximal', 'Intermediate', 'Distal'];
const curlHand = (vrm: VRM, side: 'left' | 'right', fist: number, point: number) => {
  if (fist <= 0.001 && point <= 0.001) return;
  const v0 = vrm.meta?.metaVersion === '0';
  const sgn = (side === 'right' ? -1 : 1) * (v0 ? 1 : -1);
  FINGERS.forEach((fg) => {
    const amt = fg === 'Index' ? fist : Math.max(fist, point);
    SEGS.forEach((sg, k) => {
      const n = vrm.humanoid.getNormalizedBoneNode(`${side}${fg}${sg}` as never);
      if (n) n.rotation.z = sgn * amt * (k === 0 ? 1.25 : 1.4);
    });
  });
};

// ---------- one actor ----------
type Ev = {f: number; kind: 'pose' | 'look' | 'in' | 'out' | 'talk'; v: string};

const Actor: React.FC<{def: ActorDef; evs: Ev[]; frame: number; fps: number; idx: number}> = ({def, evs, frame, fps, idx}) => {
  const {vrm, handle} = useVRM(def.model);
  const {advance} = useThree();
  const ph = idx * 2.3;
  // a phone for the "phone" and "scroll" poses: a dark slab with a lit screen, placed on the right hand every frame
  const phone = useMemo(() => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.158, 0.012), new THREE.MeshStandardMaterial({color: '#11141b', roughness: 0.4}));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.146), new THREE.MeshBasicMaterial({color: '#bfe3ff', toneMapped: false}));
    glass.position.z = 0.0065;
    body.castShadow = true;
    g.add(body, glass);
    g.visible = false;
    return g;
  }, []);

  useLayoutEffect(() => {
    if (!vrm) return;
    const h = vrm.humanoid;
    const k = (def.tall ?? 1.75) / (vrm.scene.userData.top || 1.75);
    const R = (vrm.scene.userData.headR || 0.13) * k;
    const yaw = def.yaw ?? 0;
    const at = def.at ?? [0, 0, 0];

    // ---- which pose, and how far into it ----
    const poses = evs.filter((e) => e.kind === 'pose' && frame >= e.f);
    const cur = poses.length ? poses[poses.length - 1] : null;
    const prevName = poses.length > 1 ? poses[poses.length - 2].v : (def.pose ?? 'relax');
    const curName = cur ? cur.v : (def.pose ?? 'relax');
    const since = cur ? frame - cur.f : 999;
    const tHand = cur ? interpolate(since, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))}) : 1;
    const tBody = cur ? interpolate(since, [0, 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
    const pop = cur && since >= 0 && since < 9 ? Math.sin((since / 9) * Math.PI) * (1 - since / 9) : 0;

    // ---- entrance / exit ----
    const ins = evs.filter((e) => (e.kind === 'in' || e.kind === 'out') && frame >= e.f);
    const lastIO = ins.length ? ins[ins.length - 1] : null;
    let vis = !def.hidden;
    let rise = 0;
    if (lastIO) {
      const s = frame - lastIO.f;
      const t = interpolate(s, [0, 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: lastIO.kind === 'in' ? Easing.out(Easing.back(1.5)) : Easing.in(Easing.cubic)});
      vis = lastIO.kind === 'in' ? true : t < 1;
      rise = lastIO.kind === 'in' ? (1 - t) * -2.0 : t * -2.2;
    }

    // ---- head turn (persistent) ----
    const looks = evs.filter((e) => e.kind === 'look' && frame >= e.f);
    let lookYaw = ((def.look ?? 0) * Math.PI) / 180;
    looks.forEach((e, i) => {
      const prev = i === 0 ? ((def.look ?? 0) * Math.PI) / 180 : (Number(looks[i - 1].v) * Math.PI) / 180;
      const t = interpolate(frame - e.f, [0, 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      lookYaw = lerp(prev, (Number(e.v) * Math.PI) / 180, t);
    });

    // ---- place the actor ----
    const A = poseOf(prevName, R, frame, ph);
    const B = poseOf(curName, R, frame, ph);
    const bounce = lerp(A.bounce ?? 0, B.bounce ?? 0, tBody);
    const hop = lerp(A.hop ?? 0, B.hop ?? 0, tBody);
    // one jump every 14 frames; he hangs at the top a little (the 0.7 power), which reads as a jump and not a wobble
    const bob = bounce * Math.abs(Math.sin(frame * 0.42 + ph)) * 0.05 * k + hop * Math.pow(Math.abs(Math.sin(frame * 0.224 + ph)), 0.7) * 0.3 * k;
    vrm.scene.visible = vis;
    vrm.scene.rotation.set(0, yaw + (vrm.meta?.metaVersion === '0' ? Math.PI : 0), 0);
    vrm.scene.scale.set(k * (1 - 0.035 * pop), k * (1 + 0.06 * pop), k * (1 - 0.035 * pop));
    vrm.scene.position.set(at[0], at[1] + rise + bob, at[2]);
    h.resetNormalizedPose();
    vrm.scene.updateMatrixWorld(true);

    const ax: Axes = {left: new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), up: new THREE.Vector3(0, 1, 0), fwd: new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))};
    const bone = (n: string) => h.getNormalizedBoneNode(n as never);
    const wp = (n: string) => bone(n)?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(at[0], at[1], at[2]);
    const anchors = {
      head: wp('head').add(ax.up.clone().multiplyScalar((vrm.scene.userData.headUp || 0.09) * k)),
      chest: wp('leftUpperArm').add(wp('rightUpperArm')).multiplyScalar(0.5).add(ax.up.clone().multiplyScalar(-0.1 * k)),
      hips: wp('hips'),
      floor: new THREE.Vector3(at[0], at[1], at[2]),
    };
    const tgt = (hT: HandT, side: 1 | -1) => {
      const sc = hT.a === 'head' || hT.a === 'floor' ? 1 : k; // head offsets are already in head radii, floor ones are furniture
      return anchors[hT.a]
        .clone()
        .add(ax.left.clone().multiplyScalar(side * hT.o[0] * sc))
        .add(ax.up.clone().multiplyScalar(hT.o[1] * sc))
        .add(ax.fwd.clone().multiplyScalar(hT.o[2] * sc));
    };
    const pol = (hT: HandT, side: 1 | -1) => {
      const p = hT.p ?? DOWN;
      return ax.left.clone().multiplyScalar(side * p[0]).add(ax.up.clone().multiplyScalar(p[1])).add(ax.fwd.clone().multiplyScalar(p[2]));
    };
    const solve = (D: PoseDef): Solved => ({
      rh: tgt(D.rh, -1),
      lh: tgt(D.lh, 1),
      rp: pol(D.rh, -1),
      lp: pol(D.lh, 1),
      head: D.head ?? [0, 0, 0],
      spine: D.spine ?? [0, 0, 0],
      expr: D.expr ?? {},
      rFist: D.rShape === 'fist' ? 1 : 0,
      rPoint: D.rShape === 'point' ? 1 : 0,
      lFist: D.lShape === 'fist' ? 1 : 0,
      lPoint: D.lShape === 'point' ? 1 : 0,
      bounce: D.bounce ?? 0,
      hop: D.hop ?? 0,
      item: D.item ?? '',
    });
    const a = solve(A);
    const b = solve(B);

    // ---- torso and head ----
    const breathe = Math.sin((frame / fps) * 2.1 + ph) * 0.014;
    const sp = lerpV(a.spine, b.spine, tBody);
    const hdr = lerpV(a.head, b.head, tBody);
    const spine = bone('spine');
    if (spine) applyWorldRot(spine, torsoQ([sp[0] * 0.6 + breathe, sp[1] * 0.6, sp[2] * 0.6], ax));
    const chest = bone('chest');
    if (chest) applyWorldRot(chest, torsoQ([sp[0] * 0.4, sp[1] * 0.4, sp[2] * 0.4], ax));
    const neck = bone('neck');
    const drift: V3 = [Math.sin((frame / fps) * 1.3 + ph) * 0.02, Math.sin((frame / fps) * 0.9 + ph * 1.7) * 0.035, 0];
    const headR: V3 = [hdr[0] + drift[0], hdr[1] + drift[1] + lookYaw, hdr[2]];
    if (neck) applyWorldRot(neck, torsoQ([headR[0] * 0.3, headR[1] * 0.3, headR[2] * 0.3], ax));
    const head = bone('head');
    if (head) applyWorldRot(head, torsoQ([headR[0] * 0.7, headR[1] * 0.7, headR[2] * 0.7], ax));

    // ---- legs: the knees tuck at the top of a jump ----
    if (hop > 0.01) {
      const up = hop * Math.pow(Math.abs(Math.sin(frame * 0.224 + ph)), 0.7);
      (['left', 'right'] as const).forEach((sd, i) => {
        const tuck = up * (i === 0 ? 0.55 : 0.3);
        const ul = bone(`${sd}UpperLeg`);
        const ll = bone(`${sd}LowerLeg`);
        if (ul) applyWorldRot(ul, torsoQ([-tuck, 0, 0], ax));
        if (ll) applyWorldRot(ll, torsoQ([tuck * 1.9, 0, 0], ax));
      });
    }

    // ---- arms and hands ----
    solveArm(vrm, 'right', a.rh.clone().lerp(b.rh, tHand), a.rp.clone().lerp(b.rp, tBody));
    solveArm(vrm, 'left', a.lh.clone().lerp(b.lh, tHand), a.lp.clone().lerp(b.lp, tBody));
    curlHand(vrm, 'right', lerp(a.rFist, b.rFist, tBody), lerp(a.rPoint, b.rPoint, tBody));
    curlHand(vrm, 'left', lerp(a.lFist, b.lFist, tBody), lerp(a.lPoint, b.lPoint, tBody));

    // ---- face ----
    const em = vrm.expressionManager;
    if (em) {
      em.expressions.forEach((e) => em.setValue(e.expressionName, 0));
      new Set([...Object.keys(a.expr), ...Object.keys(b.expr)]).forEach((n) => em.setValue(n, lerp(a.expr[n] ?? 0, b.expr[n] ?? 0, tBody)));
      const cyc = (frame + idx * 31) % Math.round(fps * 2.9);
      const blink = cyc < 5 ? 1 - Math.abs(cyc - 2) / 2.5 : 0;
      if (blink > 0 && !(b.expr.blink ?? 0)) em.setValue('blink', clamp01(blink));
      // speaking: the mouth flaps for the length of the line (<id>:talk:<seconds>)
      evs.forEach((e) => {
        if (e.kind !== 'talk') return;
        const s = frame - e.f;
        const n = Math.max(6, Math.round(Number(e.v || 0.6) * fps));
        if (s < 0 || s > n) return;
        const env = Math.min(1, s / 2, (n - s) / 3);
        em.setValue('aa', clamp01(env * (0.35 + 0.65 * Math.abs(Math.sin(s * 0.95)))));
        em.setValue('oh', clamp01(env * 0.45 * Math.max(0, Math.sin(s * 0.5 + 1))));
      });
      em.update();
    }
    h.update();
    vrm.scene.updateMatrixWorld(true);

    // ---- the phone ----
    const item = tBody > 0.5 ? b.item : a.item;
    phone.visible = vis && !!item;
    if (item) {
      const hand = h.getRawBoneNode('rightHand' as never)?.getWorldPosition(new THREE.Vector3()) ?? b.rh;
      phone.scale.setScalar(k * 1.15);
      if (item === 'ear') {
        // flat against the side of his head, screen towards the ear
        phone.position.copy(hand).add(ax.up.clone().multiplyScalar(0.075 * k)).add(ax.left.clone().multiplyScalar(0.035 * k)).add(ax.fwd.clone().multiplyScalar(0.02 * k));
        phone.rotation.set(0, yaw + Math.PI / 2, 0.22);
      } else {
        // held in front of his chest, screen towards his face
        phone.position.copy(hand).add(ax.up.clone().multiplyScalar(0.085 * k)).add(ax.left.clone().multiplyScalar(0.03 * k)).add(ax.fwd.clone().multiplyScalar(0.03 * k));
        phone.rotation.set(0.55, yaw + Math.PI, 0);
      }
    }
  });

  // @remotion/three only draws when the frame number changes, so a model that finishes loading on the same frame would
  // never be drawn: draw once ourselves, then release the render hold.
  useEffect(() => {
    if (!vrm) return;
    advance(performance.now());
    continueRender(handle);
  }, [vrm, advance, handle]);

  return vrm ? (
    <>
      <primitive object={vrm.scene} />
      <primitive object={phone} />
    </>
  ) : null;
};

// ---------- camera ----------
const ShotCam: React.FC<{pos: THREE.Vector3; look: THREE.Vector3; fov: number; shift: number}> = ({pos, look, fov, shift}) => {
  const {camera, size} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(pos);
  cam.fov = fov;
  cam.aspect = size.width / size.height;
  cam.setViewOffset(size.width, size.height, 0, -shift, size.width, size.height);
  cam.lookAt(look);
  cam.updateProjectionMatrix();
  return null;
};

// ---------- the monitor ----------
const screenTex = (s: ScreenState) =>
  canvasTex(1024, 640, (g) => {
    const col = TONE[s.tone ?? 'white'];
    g.fillStyle = '#0a0f1c';
    g.fillRect(0, 0, 1024, 640);
    if (s.chart) {
      let y = s.chart === 'down' ? 150 : 520;
      for (let i = 0; i < 30; i++) {
        const step = (s.chart === 'down' ? 1 : -1) * (6 + ((i * 37) % 19)) + (((i * 53) % 11) - 5) * 3;
        const ny = Math.max(120, Math.min(600, y + step));
        g.fillStyle = ny < y ? 'rgba(61,220,132,0.5)' : 'rgba(255,90,78,0.5)';
        g.fillRect(30 + i * 33, Math.min(y, ny), 20, Math.max(6, Math.abs(ny - y)));
        y = ny;
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(0, 0, 1024, 84);
    g.textBaseline = 'middle';
    if (s.head) {
      g.fillStyle = 'rgba(255,255,255,0.72)';
      g.font = `700 40px ${theme.font}`;
      g.textAlign = 'left';
      g.fillText(s.head, 36, 44);
    }
    g.textAlign = 'center';
    if (s.big) {
      let fs = 230;
      g.font = `800 ${fs}px ${theme.font}`;
      while (g.measureText(s.big).width > 940 && fs > 60) {
        fs -= 8;
        g.font = `800 ${fs}px ${theme.font}`;
      }
      g.fillStyle = col;
      g.shadowColor = col;
      g.shadowBlur = 36;
      g.fillText(s.big, 512, s.sub ? 310 : 350);
      g.shadowBlur = 0;
    }
    if (s.sub) {
      let fs = 64;
      g.font = `700 ${fs}px ${theme.mono}`;
      while (g.measureText(s.sub).width > 960 && fs > 30) {
        fs -= 4;
        g.font = `700 ${fs}px ${theme.mono}`;
      }
      g.fillStyle = 'rgba(255,255,255,0.86)';
      g.fillText(s.sub, 512, 520);
    }
  });

const keysTex = () =>
  canvasTex(840, 260, (g) => {
    g.fillStyle = '#e8e6e1';
    g.fillRect(0, 0, 840, 260);
    for (let r = 0; r < 4; r++) {
      const n = r === 3 ? 9 : 14;
      for (let c = 0; c < n; c++) {
        const w = r === 3 && c === 4 ? 250 : 48;
        const x = r === 3 ? 20 + (c < 4 ? c * 58 : c === 4 ? 232 : 232 + 260 + (c - 5) * 58) : 16 + c * 58 + (r % 2) * 8;
        g.fillStyle = r === 0 && c === 13 ? '#ff8a5c' : '#cfccc5';
        g.beginPath();
        g.roundRect(x, 14 + r * 60, w, 46, 9);
        g.fill();
      }
    }
  });

const Desk: React.FC<{tex: THREE.Texture | null; glow: string; glowI: number; turn: number; flash: number}> = ({tex, glow, glowI, turn, flash}) => {
  const keys = useMemo(() => keysTex(), []);
  return (
  <group position={[0, 0, 0.72]}>
    <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.56, 0.05, 0.64]} />
      <meshStandardMaterial color="#c9955c" roughness={0.6} />
    </mesh>
    {[-0.7, 0.7].map((x) => (
      <mesh key={x} position={[x, 0.35, 0]} castShadow>
        <boxGeometry args={[0.05, 0.7, 0.58]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.7} />
      </mesh>
    ))}
    <group position={[0, 1.015, 0.1]} rotation={[0, Math.PI - turn, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.57, 0.37, 0.03]} />
        <meshStandardMaterial color="#232a38" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.02, -0.0165]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.045, 28]} />
        <meshStandardMaterial color="#aeb9cc" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.54, 0.3375]} />
        <meshBasicMaterial map={tex ?? undefined} toneMapped={false} />
      </mesh>
      {flash > 0 ? (
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[0.54, 0.3375]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={flash * 0.8} toneMapped={false} />
        </mesh>
      ) : null}
      <mesh position={[0, -0.215, -0.02]}>
        <boxGeometry args={[0.07, 0.08, 0.04]} />
        <meshStandardMaterial color="#11141b" />
      </mesh>
    </group>
    <mesh position={[0, 0.752, 0.06]}>
      <boxGeometry args={[0.24, 0.012, 0.14]} />
      <meshStandardMaterial color="#11141b" />
    </mesh>
    {/* keyboard, mouse, mug on the actor's side of the desk */}
    <mesh position={[0, 0.757, -0.2]} castShadow>
      <boxGeometry args={[0.42, 0.018, 0.13]} />
      <meshStandardMaterial color="#e8e6e1" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.7665, -0.2]} rotation={[-Math.PI / 2, 0, Math.PI]}>
      <planeGeometry args={[0.41, 0.125]} />
      <meshStandardMaterial map={keys ?? undefined} roughness={0.7} />
    </mesh>
    <mesh position={[-0.33, 0.762, -0.2]} castShadow>
      <boxGeometry args={[0.06, 0.028, 0.1]} />
      <meshStandardMaterial color="#e8e6e1" roughness={0.5} />
    </mesh>
    <mesh position={[0.52, 0.8, -0.12]} castShadow>
      <cylinderGeometry args={[0.045, 0.04, 0.1, 20]} />
      <meshStandardMaterial color="#f4f1ea" roughness={0.5} />
    </mesh>
    <pointLight position={[0, 1.12, -0.22]} color={glow} intensity={glowI} distance={2.6} decay={1.5} />
  </group>
  );
};

const Plant: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <mesh position={[0, 0.17, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.11, 0.34, 20]} />
      <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[Math.sin(i * 1.9) * 0.12, 0.62 + (i % 3) * 0.16, Math.cos(i * 1.9) * 0.12]} rotation={[0.3 * Math.sin(i), i, 0.3 * Math.cos(i)]} castShadow>
        <sphereGeometry args={[0.2 - (i % 3) * 0.03, 12, 10]} />
        <meshStandardMaterial color={i % 2 ? '#2f9e62' : '#3fb574'} roughness={0.8} flatShading />
      </mesh>
    ))}
  </group>
);

// ---------- set dressing ----------
const Solid: React.FC<{d: PropDef}> = ({d}) => {
  const z = d.size ?? [];
  const rot = (d.rot ?? [0, 0, 0]).map((v) => (v * Math.PI) / 180) as V3;
  const color = d.color ?? '#8595a8';
  return (
    <mesh position={d.at} rotation={rot} castShadow={!d.glow} receiveShadow={!d.glow}>
      {d.shape === 'cyl' ? (
        <cylinderGeometry args={[z[0] ?? 0.2, z[0] ?? 0.2, z[1] ?? 0.4, 28]} />
      ) : d.shape === 'ball' ? (
        <sphereGeometry args={[z[0] ?? 0.2, 28, 20]} />
      ) : d.shape === 'cone' ? (
        <coneGeometry args={[z[0] ?? 0.2, z[1] ?? 0.4, 28]} />
      ) : d.shape === 'plane' ? (
        <planeGeometry args={[z[0] ?? 0.5, z[1] ?? 0.5]} />
      ) : (
        <boxGeometry args={[z[0] ?? 0.4, z[1] ?? 0.4, z[2] ?? 0.4]} />
      )}
      {d.glow ? (
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.75} side={d.shape === 'plane' ? THREE.DoubleSide : THREE.FrontSide} />
      )}
    </mesh>
  );
};

/** Outdoors: a sky in the mood's wall colour, paler at the horizon, with stars and a moon when the light is low. */
const Sky: React.FC<{color: string; dark: number}> = ({color, dark}) => {
  const haze = useMemo(
    () =>
      canvasTex(16, 256, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(0.55, 'rgba(255,255,255,0.12)');
        grd.addColorStop(1, 'rgba(255,255,255,0.6)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 16, 256);
      }),
    [],
  );
  const stars = useMemo(
    () =>
      canvasTex(2048, 1024, (g) => {
        for (let i = 0; i < 520; i++) {
          const x = (i * 397.3) % 2048;
          const y = ((i * 189.7) % 860) + ((i * 13) % 7);
          const r = 0.9 + ((i * 31) % 10) / 9;
          g.fillStyle = `rgba(255,255,255,${0.4 + ((i * 17) % 10) / 17})`;
          g.beginPath();
          g.arc(x, y, r, 0, Math.PI * 2);
          g.fill();
        }
      }),
    [],
  );
  return (
    <group position={[0, 0, -29]}>
      <mesh position={[0, 20, 0]}>
        <planeGeometry args={[140, 44]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 20, 0.05]}>
        <planeGeometry args={[140, 44]} />
        <meshBasicMaterial map={haze ?? undefined} transparent opacity={0.06 + 0.8 * (1 - dark)} toneMapped={false} />
      </mesh>
      {dark > 0.02 ? (
        <>
          <mesh position={[0, 21, 0.1]}>
            <planeGeometry args={[110, 40]} />
            <meshBasicMaterial map={stars ?? undefined} transparent opacity={dark} toneMapped={false} />
          </mesh>
          <mesh position={[-4, 8.5, 0.15]}>
            <circleGeometry args={[1.3, 40]} />
            <meshBasicMaterial color="#f4f1e4" transparent opacity={dark} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

// ---------- the scene ----------
export const Actor3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  // "a+b" fires several actions on the same beat
  const groups = (props.actions ?? []).map((a) => a.split('+'));
  const acts = groups.flat();
  const beatOf = groups.flatMap((g, i) => g.map(() => i));
  const fAt = (i: number) => revealFrame(beats, beatOf[i] ?? i) - LEAD_FRAMES;
  const p = (i: number, dur = 10, ease = Easing.out(Easing.cubic)) => interpolate(frame, [fAt(i), fAt(i) + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const first = (name: string) => acts.indexOf(name);

  // per-actor events
  const evs = useMemo(() => {
    const m: Record<string, Ev[]> = {};
    props.actors.forEach((a) => (m[a.id] = []));
    acts.forEach((a, i) => {
      const [id, what, arg] = a.split(':');
      if (!m[id] || !what) return;
      const f = revealFrame(beats, beatOf[i] ?? i) - LEAD_FRAMES;
      if (what === 'look') m[id].push({f, kind: 'look', v: arg ?? '0'});
      else if (what === 'talk') m[id].push({f, kind: 'talk', v: arg ?? '0.6'});
      else if (what === 'in' || what === 'out') m[id].push({f, kind: what, v: ''});
      else m[id].push({f, kind: 'pose', v: what});
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acts.join('|'), beats.join(','), props.actors.map((a) => a.id).join(',')]);

  // mood (colours + light), blended on mood:<name>
  let mood = MOODS[props.mood ?? 'day'] ?? MOODS.day;
  acts.forEach((a, i) => {
    if (!a.startsWith('mood:') || frame < fAt(i)) return;
    const to = MOODS[a.slice(5)] ?? MOODS.day;
    const t = p(i, 9);
    const mix = (x: string, y: string) => `#${new THREE.Color(x).lerp(new THREE.Color(y), t).getHexString()}`;
    mood = {wall: mix(mood.wall, to.wall), floor: mix(mood.floor, to.floor), key: lerp(mood.key, to.key, t), fill: lerp(mood.fill, to.fill, t), glow: mix(mood.glow, to.glow), glowI: lerp(mood.glowI, to.glowI, t)};
  });

  // monitor state
  const screens = props.screens ?? {};
  let scr = props.screen ?? '';
  let scrAt = -999;
  acts.forEach((a, i) => {
    if (a.startsWith('screen:') && frame >= fAt(i) && fAt(i) >= scrAt) {
      scr = a.slice(7);
      scrAt = fAt(i);
    }
  });
  const flash = scrAt > -999 ? Math.max(0, 1 - (frame - scrAt) / 6) : 0;
  const stateKeys = useMemo(() => Array.from(new Set([props.screen ?? '', ...acts.filter((a) => a.startsWith('screen:')).map((a) => a.slice(7))])), [props.screen, acts]);
  const texSet = useMemo(
    () => Object.fromEntries(stateKeys.map((k) => [k, screenTex(screens[k] ?? {})])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateKeys.join('|'), JSON.stringify(screens)],
  );

  // camera (+ shake)
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0.6, 1.15, 4.7], look: [0, 0.9, 0], fov: 28});
  acts.forEach((a, i) => {
    if (a !== 'shake') return;
    const s = frame - fAt(i);
    if (s < 0 || s > 12) return;
    const k = (1 - s / 12) * 0.035;
    cam.pos.add(new THREE.Vector3(Math.sin(s * 9.1) * k, Math.cos(s * 7.3) * k, 0));
  });

  // overlays
  const tagShow = (props.tags ?? []).map((_, i) => {
    const on = first(`label:${i}`);
    const off = first(`hide:${i}`);
    return (on < 0 ? 0 : p(on, 10, Easing.out(Easing.back(1.5)))) * (off < 0 ? 1 : 1 - p(off, 8));
  });
  const st = props.stamp;
  const stI = first('stamp');
  const stP = stI < 0 ? 0 : p(stI, 7, Easing.out(Easing.back(2.2)));
  const shift = props.shift ?? CANVAS.shift;

  return (
    <div style={{position: 'absolute', left: 0, top: CANVAS.top, width, height: CANVAS.h}}>
      <ThreeCanvas width={CANVAS.w} height={CANVAS.h} shadows gl={{antialias: true, alpha: false, preserveDrawingBuffer: true}} camera={{fov: cam.fov, near: 0.05, far: 100}}>
        <ShotCam pos={cam.pos} look={cam.look} fov={cam.fov} shift={shift} />
        <color attach="background" args={[mood.wall]} />
        <hemisphereLight args={['#ffffff', mood.floor, mood.fill]} />
        <directionalLight
          position={[2.4, 4.4, 3.4]}
          intensity={mood.key}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-3.5}
          shadow-camera-right={3.5}
          shadow-camera-top={3.5}
          shadow-camera-bottom={-3.5}
          shadow-bias={-0.0004}
          shadow-radius={6}
        />
        <directionalLight position={[-3, 2.4, -2.5]} intensity={0.9} color="#9cc2ff" />
        <directionalLight position={[-2.5, 1.5, 3]} intensity={0.45} color="#ffd9b0" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={mood.floor} roughness={0.92} />
        </mesh>
        {props.backdrop === 'sky' ? (
          <Sky color={mood.wall} dark={clamp01((1.3 - mood.key) / 0.8)} />
        ) : (
          <mesh position={[0, 6, -2.6]} receiveShadow>
            <planeGeometry args={[60, 12]} />
            <meshStandardMaterial color={mood.wall} roughness={1} />
          </mesh>
        )}
        {(props.props ?? []).map((d, i) => (
          <Solid key={i} d={d} />
        ))}
        {props.set === 'desk' ? (
          <>
            <Desk tex={texSet[scr] ?? null} glow={mood.glow} glowI={mood.glowI + flash * 2} turn={props.screenTurn ?? 0} flash={flash} />
            <Plant position={[-1.25, 0, -1.7]} />
          </>
        ) : null}
        {props.actors.map((a, i) => (
          <Actor key={a.id} def={a} evs={evs[a.id] ?? []} frame={frame} fps={fps} idx={i} />
        ))}
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.35} luminanceThreshold={0.82} mipmapBlur radius={0.6} />
          <Vignette darkness={0.34} offset={0.35} />
        </EffectComposer>
      </ThreeCanvas>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {st && stP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: (st.x ?? 540) - 500,
            width: 1000,
            top: st.y ?? 1180,
            textAlign: 'center',
            fontFamily: theme.font,
            fontWeight: 900,
            fontSize: st.size ?? 150,
            letterSpacing: 2,
            color: TONE[st.tone ?? 'warm'],
            WebkitTextStroke: '10px #0b0f1a',
            paintOrder: 'stroke fill',
            textShadow: '0 10px 0 #0b0f1a',
            transform: `rotate(${st.rot ?? -7}deg) scale(${interpolate(stP, [0, 1], [2.4, 1])})`,
            opacity: Math.min(1, stP * 2),
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {st.text}
        </div>
      ) : null}
      {props.caption ? <Caption text={props.caption} y={1500} /> : null}
    </div>
  );
};

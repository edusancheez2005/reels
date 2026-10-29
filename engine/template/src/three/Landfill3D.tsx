import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Caption, Studio, Tags, useCamera, useClock, glowMat, rand, type Cam, type Tag} from './kit';
import {LaptopDrive} from './Drives3D';

/**
 * Landfill3D — a landfill mound (soil + a carpet of lumpy bin bags, boxes, tyres, cans, planks) and a generic, unbranded
 * 2.5-inch laptop hard drive (LaptopDrive). For "lost in the rubbish / buried / can't get it back" beats.
 *
 * actions (one per beat):
 *   drive      the hard drive floats in, turning, with a soft glow
 *   drop       it tumbles down onto the mound
 *   bury       rubbish rains onto the spot; the drive sinks out of sight (a faint marker stays)
 *   ping       an amber locator ring pulses on the spot ("it's still down there")
 *   scan       a searchlight sweeps across the mound
 *   fence      a security fence + barrier rise in front of the mound
 *   deny       the barrier flashes red
 *   own        a cyan boundary ring sweeps around the whole site (whose property it is)
 *   key        a gold key rises out of the drive (key-to-the-coins beat; use with `solo`)
 *   label:<n>  show tag n        cam   (no-op beat for cam[])
 * props: solo (drive only, no landfill), buried (start buried), fenced (start fenced), tags, caption, cam
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  solo?: boolean;
  buried?: boolean;
  fenced?: boolean;
  owned?: boolean;
};

const AMBER = '#FFB547';
const CYAN = '#3bc9ee';
const RED = '#FF5A4E';
const SPOT: [number, number] = [0.9, 0.9]; // x, z of the drive's resting place

/** mound height at (x, z) */
const mound = (x: number, z: number) => {
  const r = Math.hypot(x * 0.9, z * 1.1);
  const base = 1.7 * Math.exp(-(r * r) / 14);
  const ridges = 0.08 * Math.sin(x * 2.3 + z * 1.1) + 0.06 * Math.sin(z * 3.1 - x * 0.7) + 0.05 * Math.sin((x + z) * 5.3);
  return base + ridges * Math.min(1, base * 1.5) - 0.4;
};

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** A generic 3.5" hard drive: aluminium base, top cover with platter bulge + screws, blank label, green board, connector. */
export const HardDrive: React.FC<{glow: number}> = ({glow}) => {
  const baseMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#7c858f', metalness: 0.9, roughness: 0.38}), []);
  const coverMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#c3cad2', metalness: 1, roughness: 0.24, clearcoat: 0.3}), []);
  const screwMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#e8edf2', metalness: 1, roughness: 0.15}), []);
  const pcbMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#1f5a3a', metalness: 0.2, roughness: 0.55}), []);
  const chipMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#111418', roughness: 0.4}), []);
  const labelTex = useMemo(
    () =>
      tex(512, 360, (g) => {
        g.fillStyle = '#f4f5f6';
        g.fillRect(0, 0, 512, 360);
        g.fillStyle = '#20252b';
        g.font = '800 54px Inter, "DejaVu Sans", Arial, sans-serif';
        g.fillText('HARD DRIVE', 34, 84);
        g.fillStyle = '#6b7480';
        g.font = '600 30px Inter, "DejaVu Sans", Arial, sans-serif';
        g.fillText('3.5" · 7200 RPM', 34, 132);
        for (let i = 0; i < 26; i++) g.fillRect(34 + i * 12 + (i % 3) * 3, 200, 4 + (i % 4) * 2, 90);
        g.fillStyle = '#9aa3ad';
        g.fillRect(34, 312, 440, 6);
      }),
    [],
  );
  const glowM = useMemo(() => glowMat(AMBER, 1.4), []);
  glowM.opacity = glow;
  glowM.transparent = true;
  const baseGeo = useMemo(() => new RoundedBoxGeometry(1.02, 0.2, 1.46, 4, 0.04), []);
  return (
    <group>
      <mesh geometry={baseGeo} material={baseMat} />
      {/* top cover */}
      <mesh material={coverMat} position={[0, 0.105, 0]}>
        <boxGeometry args={[0.98, 0.012, 1.42]} />
      </mesh>
      {/* platter bulge + spindle */}
      <mesh material={coverMat} position={[0, 0.115, -0.22]}>
        <cylinderGeometry args={[0.42, 0.44, 0.02, 64]} />
      </mesh>
      <mesh material={screwMat} position={[0, 0.13, -0.22]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 32]} />
      </mesh>
      {/* actuator bump */}
      <mesh material={coverMat} position={[0.3, 0.115, 0.38]}>
        <cylinderGeometry args={[0.16, 0.16, 0.018, 40]} />
      </mesh>
      {/* label */}
      <mesh position={[-0.06, 0.128, 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.44]} />
        <meshStandardMaterial map={labelTex ?? undefined} roughness={0.7} />
      </mesh>
      {/* screws */}
      {[
        [-0.45, -0.66],
        [0.45, -0.66],
        [-0.45, 0.66],
        [0.45, 0.66],
        [-0.45, 0],
        [0.45, 0],
      ].map(([x, z], i) => (
        <mesh key={i} material={screwMat} position={[x, 0.118, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.016, 16]} />
        </mesh>
      ))}
      {/* green board underneath */}
      <mesh material={pcbMat} position={[0, -0.112, 0.15]}>
        <boxGeometry args={[0.9, 0.02, 1.0]} />
      </mesh>
      {[
        [-0.2, 0.2, 0.22, 0.18],
        [0.2, 0.35, 0.14, 0.14],
        [0.1, -0.1, 0.1, 0.1],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} material={chipMat} position={[x, -0.125, z]}>
          <boxGeometry args={[w, 0.012, d]} />
        </mesh>
      ))}
      {/* connector end */}
      <mesh material={chipMat} position={[0.1, -0.02, 0.735]}>
        <boxGeometry args={[0.6, 0.1, 0.03]} />
      </mesh>
      {glow > 0.01 ? (
        <mesh material={glowM} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]}>
          <ringGeometry args={[0.95, 1.05, 64]} />
        </mesh>
      ) : null}
    </group>
  );
};

export const Key: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <mesh material={mat}>
      <torusGeometry args={[0.2, 0.06, 20, 48]} />
    </mesh>
    <mesh material={mat} position={[0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.045, 0.045, 0.85, 20]} />
    </mesh>
    {[0.84, 0.94, 1.02].map((x, i) => (
      <mesh key={i} material={mat} position={[x, -0.07 - (i % 2) * 0.03, 0]}>
        <boxGeometry args={[0.06, 0.1 + (i % 2) * 0.06, 0.06]} />
      </mesh>
    ))}
  </group>
);

/** One draw call for many copies of a mesh. */
const Inst: React.FC<{geo: THREE.BufferGeometry; mat: THREE.Material; items: THREE.Matrix4[]}> = ({geo, mat, items}) => {
  const ref = React.useCallback(
    (m: THREE.InstancedMesh | null) => {
      if (!m) return;
      items.forEach((mx, i) => m.setMatrixAt(i, mx));
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    },
    [items],
  );
  return items.length ? <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} /> : null;
};

/** A lumpy bin bag: a displaced sphere, flat bottom, pinched tie on top. */
const makeBagGeo = () => {
  const g = new THREE.SphereGeometry(1, 14, 10);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 0.13 * Math.sin(v.x * 4.7 + v.y * 2.9) + 0.09 * Math.sin(v.z * 6.3 - v.x * 2.3) + 0.05 * Math.sin((v.x + v.y + v.z) * 10.1);
    v.multiplyScalar(1 + n);
    if (v.y < 0) v.y *= 0.55;
    if (v.y > 0.72) {
      const k = 0.35 + (1 - (v.y - 0.72) / 0.5) * 0.4;
      v.x *= k;
      v.z *= k;
      v.y += 0.12;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

// rubbish palette: black/green/blue bags, cardboard, paper, cans, plastic
const JUNK = ['#1c1f24', '#2c3a2a', '#24324a', '#8a6a44', '#a07c50', '#d9d4c7', '#9aa3ad', '#6b2c2c', '#3e5f7a', '#c9b37a'];

export const Landfill3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 3.4, 9.5], look: [0, 0.2, 0], fov: 34});
  const solo = !!props.solo;

  // ---- terrain ----
  const terrain = useMemo(() => {
    const g = new THREE.PlaneGeometry(26, 26, 96, 96);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cols: number[] = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const n = rand(Math.floor(x * 7) * 131 + Math.floor(z * 7));
      const y = mound(x, z) + (n - 0.5) * 0.05;
      pos.setY(i, y);
      const h = THREE.MathUtils.clamp((y + 0.4) / 1.7, 0, 1);
      // low = wet dark soil, slopes = brown/grey rubbish soil, speckles
      c.set('#2a2622').lerp(new THREE.Color('#5a5046'), h);
      if (n > 0.86) c.lerp(new THREE.Color(JUNK[Math.floor(n * 97) % JUNK.length]), 0.6);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1, metalness: 0, flatShading: true}), []);

  // the rubbish carpet (instanced): bags in four colours, boxes, tyres, cans, planks
  const carpet = useMemo(() => {
    const bags: THREE.Matrix4[][] = [[], [], [], []];
    const boxes: THREE.Matrix4[] = [];
    const tyres: THREE.Matrix4[] = [];
    const cans: THREE.Matrix4[] = [];
    const planks: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const put = (arr: THREE.Matrix4[], x: number, z: number, sc: [number, number, number], r: [number, number, number], lift: number) => {
      e.set(r[0], r[1], r[2]);
      q.setFromEuler(e);
      arr.push(new THREE.Matrix4().compose(new THREE.Vector3(x, mound(x, z) + lift, z), q.clone(), new THREE.Vector3(...sc)));
    };
    const spotFree = (x: number, z: number) => Math.hypot(x - SPOT[0], z - SPOT[1]) > 0.42;
    for (let i = 0; i < 340; i++) {
      const a = rand(i * 1.7 + 0.3) * Math.PI * 2;
      const rr = Math.pow(rand(i + 500), 0.75) * 5.2;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr * 0.85;
      if (!spotFree(x, z)) continue;
      const sz = 0.16 + rand(i + 33) * 0.17;
      const k = rand(i + 77);
      const col = k < 0.5 ? 0 : k < 0.72 ? 1 : k < 0.88 ? 2 : 3;
      put(bags[col], x, z, [sz, sz * (0.62 + rand(i + 9) * 0.22), sz * (0.85 + rand(i + 4) * 0.3)], [(rand(i + 1) - 0.5) * 0.7, rand(i + 2) * 6.28, (rand(i + 3) - 0.5) * 0.7], sz * 0.3);
    }
    for (let i = 0; i < 46; i++) {
      const a = rand(i * 3.1 + 7) * Math.PI * 2;
      const rr = Math.pow(rand(i + 900), 0.8) * 4.8;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr * 0.85;
      if (!spotFree(x, z)) continue;
      const sz = 0.16 + rand(i + 21) * 0.16;
      put(boxes, x, z, [sz * 1.3, sz * 0.75, sz], [(rand(i + 5) - 0.5) * 0.8, rand(i + 6) * 6.28, (rand(i + 8) - 0.5) * 0.8], sz * 0.3);
    }
    for (let i = 0; i < 12; i++) {
      const a = rand(i * 5.3 + 2) * Math.PI * 2;
      const rr = 1.2 + rand(i + 300) * 3.4;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr * 0.85;
      if (!spotFree(x, z)) continue;
      put(tyres, x, z, [1, 1, 1], [Math.PI / 2 + (rand(i + 1) - 0.5) * 0.8, rand(i + 2) * 6.28, (rand(i + 3) - 0.5) * 0.6], 0.05);
    }
    for (let i = 0; i < 30; i++) {
      const a = rand(i * 2.3 + 11) * Math.PI * 2;
      const rr = Math.pow(rand(i + 700), 0.8) * 4.6;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr * 0.85;
      if (!spotFree(x, z)) continue;
      put(cans, x, z, [0.05, 0.13, 0.05], [Math.PI / 2, rand(i + 2) * 6.28, 0], 0.05);
    }
    for (let i = 0; i < 18; i++) {
      const a = rand(i * 4.1 + 19) * Math.PI * 2;
      const rr = Math.pow(rand(i + 800), 0.8) * 4.4;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr * 0.85;
      if (!spotFree(x, z)) continue;
      put(planks, x, z, [0.9 + rand(i) * 0.6, 0.04, 0.12], [(rand(i + 1) - 0.5) * 0.3, rand(i + 2) * 6.28, (rand(i + 3) - 0.5) * 0.3], 0.08);
    }
    return {bags, boxes, tyres, cans, planks};
  }, []);
  const bagGeo = useMemo(() => makeBagGeo(), []);
  const bagMats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({color: '#15171b', roughness: 0.24}),
      new THREE.MeshStandardMaterial({color: '#223021', roughness: 0.3}),
      new THREE.MeshStandardMaterial({color: '#1c2c48', roughness: 0.3}),
      new THREE.MeshStandardMaterial({color: '#9aa1a9', roughness: 0.42}),
    ],
    [],
  );
  const boxGeo1 = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.06), []);
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#8a6a44', roughness: 0.92}), []);
  const tyreGeo = useMemo(() => new THREE.TorusGeometry(0.2, 0.085, 12, 28), []);
  const tyreMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#121315', roughness: 0.85}), []);
  const canGeo1 = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 16), []);
  const canMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#a3acb6', metalness: 0.8, roughness: 0.35}), []);
  const plankMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#6b4a2e', roughness: 0.88}), []);
  // falling rubbish reuses these
  const geos = [bagGeo, boxGeo1, canGeo1, boxGeo1];

  // ---- timeline ----
  const driveIn = has('drive') ? p('drive', 20, Easing.out(Easing.back(1.3))) : props.buried || has('drop') || has('bury') ? 1 : solo ? 1 : 0;
  const dropP = has('drop') ? p('drop', 22, Easing.in(Easing.quad)) : props.buried ? 1 : 0;
  const buryP = props.buried ? 1 : p('bury', 30, Easing.inOut(Easing.cubic));
  const buryS = since('bury');
  const pingS = since('ping');
  const scanS = since('scan');
  const fenceP = props.fenced ? 1 : p('fence', 20, Easing.out(Easing.back(1.4)));
  const denyS = since('deny');
  const ownP = props.owned ? 1 : p('own', 34, Easing.inOut(Easing.cubic));
  const keyP = p('key', 22, Easing.out(Easing.back(1.4)));

  const spotY = mound(SPOT[0], SPOT[1]);
  const hover = new THREE.Vector3(solo ? 0 : -0.45, solo ? 0.2 : 2.1, solo ? 0 : 1.8);
  const land = new THREE.Vector3(SPOT[0], spotY + 0.12, SPOT[1]);
  const dp = hover.clone().lerp(land, dropP);
  dp.y += Math.sin(dropP * Math.PI) * 0.6;
  const sink = buryP * 0.5;
  const driveRot: [number, number, number] = solo
    ? [0.55 + Math.sin(frame / 40) * 0.05, -0.5 + frame * 0.006, 0.08]
    : [0.5 * (1 - dropP) + dropP * 0.18 + Math.sin(frame / 18) * 0.06 * (1 - dropP), (1 - driveIn) * 2 + frame * 0.012 * (1 - dropP) + dropP * 0.7, dropP * 0.12];
  const glow = solo ? 0.5 + 0.2 * Math.sin(frame / 8) : (1 - dropP) * (0.45 + 0.25 * Math.sin(frame / 7));

  // falling rubbish onto the spot
  const fallers = 60;
  const fall = Array.from({length: fallers}).map((_, i) => {
    const t0 = i * 0.35;
    const t = buryS < 0 && !props.buried ? -1 : props.buried ? 999 : buryS - t0;
    const a = rand(i + 900) * Math.PI * 2;
    const r = rand(i + 950) * 0.55;
    const x = SPOT[0] + Math.cos(a) * r;
    const z = SPOT[1] + Math.sin(a) * r;
    const yRest = mound(x, z) + 0.05 + (i / fallers) * 0.35;
    const y = t < 0 ? 99 : Math.max(yRest, yRest + 4 - 0.012 * t * t * 1.6);
    return {x, y, z, kind: i % 3 === 0 ? 1 : 0, col: i % 4, s: 0.1 + rand(i + 990) * 0.09, r: rand(i + 970) * 6 + (y > yRest ? t * 0.1 : 0)};
  });

  // pulse ring
  const pingAge = pingS >= 0 ? pingS % 30 : -1;
  const pingMat = useMemo(() => new THREE.MeshBasicMaterial({color: AMBER, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide}), []);
  pingMat.opacity = pingAge >= 0 ? 0.9 * (1 - pingAge / 30) : 0;
  const markerMat = useMemo(() => glowMat(AMBER, 2.2), []);
  const beamMat = useMemo(() => new THREE.MeshBasicMaterial({color: AMBER, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending}), []);
  beamMat.opacity = pingS >= 0 ? 0.18 + 0.06 * Math.sin(frame / 6) : 0;

  // searchlight
  const scanMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#e6f4ff', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}), []);
  scanMat.opacity = scanS >= 0 ? 0.22 : 0;
  const scanX = scanS >= 0 ? -3.5 + ((scanS * 0.11) % 7) : 0;

  // fence + barrier
  const postMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#9aa6b2', metalness: 0.9, roughness: 0.35}), []);
  const meshTex = useMemo(
    () =>
      tex(256, 256, (g) => {
        g.clearRect(0, 0, 256, 256);
        g.strokeStyle = 'rgba(210,220,230,0.85)';
        g.lineWidth = 3;
        for (let k = -256; k < 512; k += 32) {
          g.beginPath();
          g.moveTo(k, 0);
          g.lineTo(k + 256, 256);
          g.stroke();
          g.beginPath();
          g.moveTo(k + 256, 0);
          g.lineTo(k, 256);
          g.stroke();
        }
      }),
    [],
  );
  if (meshTex) {
    meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping;
    meshTex.repeat.set(10, 1);
  }
  const fenceMat = useMemo(() => new THREE.MeshStandardMaterial({map: meshTex ?? undefined, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4}), [meshTex]);
  const denyFlash = denyS >= 0 ? 0.5 + 0.5 * Math.sin(denyS / 2.2) : 0;
  const barMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#f2f2f2', emissive: new THREE.Color(RED), emissiveIntensity: 0, roughness: 0.4}), []);
  barMat.emissiveIntensity = denyS >= 0 ? 0.4 + 1.8 * denyFlash : 0;
  barMat.color = new THREE.Color(denyS >= 0 ? '#ff7a70' : '#f2f2f2');
  const stripeMat = useMemo(() => new THREE.MeshStandardMaterial({color: RED, roughness: 0.4}), []);

  // ownership ring
  const ownMat = useMemo(() => glowMat(CYAN, 2), []);
  const ownGeo = useMemo(() => new THREE.TorusGeometry(5.6, 0.035, 8, 160, Math.PI * 2), []);

  // gulls
  const gulls = Array.from({length: solo ? 0 : 5}).map((_, i) => {
    const a = frame / (50 + i * 9) + i * 1.3;
    const R = 2.2 + i * 0.6;
    const flap = Math.sin(frame / 3 + i) * 0.5;
    return {x: Math.cos(a) * R, y: 2.2 + i * 0.15 + Math.sin(frame / 20 + i) * 0.1, z: Math.sin(a) * R * 0.6 - 1, rot: -a, flap};
  });
  const gullMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#dfe5ea', roughness: 0.8}), []);

  const keyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#F2C45A', metalness: 1, roughness: 0.2, clearcoat: 0.8, emissive: new THREE.Color('#7a4a00'), emissiveIntensity: 0.5}), []);

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  const driveVisible = driveIn > 0.01 && buryP < 0.98;

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.9} warm={solo ? 0 : 0.25}>
      {!solo ? <fog attach="fog" args={['#0b1220', 9, 26]} /> : null}
      {!solo ? (
        <>
          <mesh geometry={terrain} material={groundMat} />
          {carpet.bags.map((items, i) => (
            <Inst key={`b${i}`} geo={bagGeo} mat={bagMats[i]} items={items} />
          ))}
          <Inst geo={boxGeo1} mat={boxMat} items={carpet.boxes} />
          <Inst geo={tyreGeo} mat={tyreMat} items={carpet.tyres} />
          <Inst geo={canGeo1} mat={canMat} items={carpet.cans} />
          <Inst geo={boxGeo1} mat={plankMat} items={carpet.planks} />
          {fall.map((f, i) =>
            f.y < 50 ? (
              <mesh key={`f${i}`} geometry={geos[f.kind]} material={f.kind === 0 ? bagMats[f.col] : boxMat} position={[f.x, f.y, f.z]} rotation={[f.r, f.r * 0.7, f.r * 0.3]} scale={f.kind === 1 ? [f.s * 1.3, f.s * 0.75, f.s] : [f.s * 1.2, f.s * 0.8, f.s]} />
            ) : null,
          )}
          {/* locator */}
          {pingS >= 0 ? (
            <group position={[SPOT[0], spotY + 0.45, SPOT[1]]}>
              <mesh material={pingMat} rotation={[-Math.PI / 2, 0, 0]} scale={0.3 + (pingAge / 30) * 1.6}>
                <ringGeometry args={[0.8, 1, 64]} />
              </mesh>
              <mesh material={markerMat} scale={0.09 + 0.02 * Math.sin(frame / 5)}>
                <sphereGeometry args={[1, 16, 16]} />
              </mesh>
              <mesh material={beamMat} position={[0, 1.3, 0]}>
                <cylinderGeometry args={[0.04, 0.2, 2.6, 24, 1, true]} />
              </mesh>
            </group>
          ) : null}
          {/* searchlight */}
          {scanS >= 0 ? (
            <mesh material={scanMat} position={[scanX, 2.5, 0.5]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.15, 1.1, 5, 32, 1, true]} />
            </mesh>
          ) : null}
          {/* fence across the front */}
          {fenceP > 0 ? (
            <group position={[0, -0.4 - (1 - fenceP) * 1.4, 4.2]}>
              {Array.from({length: 9}).map((_, i) => (
                <mesh key={i} material={postMat} position={[-4.8 + i * 1.2, 0.7, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 1.4, 12]} />
                </mesh>
              ))}
              <mesh material={fenceMat} position={[-1.2, 0.72, 0]}>
                <planeGeometry args={[7.2, 1.3]} />
              </mesh>
              <mesh material={fenceMat} position={[3.6, 0.72, 0]}>
                <planeGeometry args={[2.4, 1.3]} />
              </mesh>
              {/* barrier arm at the gate */}
              <group position={[2.4, 0.75, 0.15]}>
                <mesh material={barMat} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 2.4, 16]} />
                </mesh>
                {[-0.8, -0.27, 0.27, 0.8].map((x, i) => (
                  <mesh key={i} material={stripeMat} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.062, 0.062, 0.18, 16]} />
                  </mesh>
                ))}
              </group>
            </group>
          ) : null}
          {ownP > 0 ? (
            <mesh geometry={ownGeo} material={ownMat} rotation={[-Math.PI / 2, 0, ownP * 0.4]} position={[0, -0.32, 0]} scale={[ownP, ownP, 1]} />
          ) : null}
          {gulls.map((g, i) => (
            <group key={`g${i}`} position={[g.x, g.y, g.z]} rotation={[0, g.rot, 0]} scale={0.22}>
              <mesh material={gullMat} position={[0, 0, 0.45]} rotation={[g.flap, 0, 0]}>
                <boxGeometry args={[0.18, 0.03, 0.9]} />
              </mesh>
              <mesh material={gullMat} position={[0, 0, -0.45]} rotation={[-g.flap, 0, 0]}>
                <boxGeometry args={[0.18, 0.03, 0.9]} />
              </mesh>
              <mesh material={gullMat}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[40, 64]} />
          <meshStandardMaterial color="#0a101b" roughness={1} />
        </mesh>
      )}
      {driveVisible ? (
        <group position={[dp.x, dp.y - sink, dp.z]} rotation={driveRot} scale={(solo ? 2.3 : 0.9) * Math.min(1, driveIn)}>
          <LaptopDrive glow={glow} />
        </group>
      ) : null}
      {solo && keyP > 0 ? (
        <group position={[-0.5 + keyP * 0.1, 0.35 + keyP * 1.05, 0.4]} rotation={[0.2, 0.3, 0.15 + Math.sin(frame / 12) * 0.05]} scale={keyP * 1.05}>
          <Key mat={keyMat} />
        </group>
      ) : null}
    </Studio>
  );
};

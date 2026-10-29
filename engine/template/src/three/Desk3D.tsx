import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Caption, Studio, Tags, useCamera, useClock, glowMat, rand, type Cam, type Tag} from './kit';
import {HardDrive} from './Landfill3D';

/**
 * Laptop3D — a home-office desk story: a generic laptop on a wooden desk, a glass, a desk drawer and a black bin bag.
 * For "what happened to the device that held the key" beats (mining on a laptop, accidents, storage, throwing it out).
 *
 * actions (one per beat):
 *   open       the lid swings open, the screen wakes
 *   mine       the screen scrolls a mining log; gold coins pop out of the laptop and pile up beside it
 *   spill      the glass tips over; liquid floods the keyboard; the screen flickers and dies; sparks
 *   parts      the laptop comes apart (lid, keyboard deck, battery, board fly off and fade); its hard drive stays, glowing
 *   drawer     the drawer slides out, the drive drops in, the drawer slides shut
 *   bag        the drawer opens, the drive lifts out and drops into the bin bag; the bag cinches shut
 *   label:<n>  show tag n        cam   (no-op beat for cam[])
 * state props (for later scenes): opened, coins (pile already there), broken (laptop gone, drive on desk),
 *   inDrawer (drive already in the drawer), tags, caption, cam
 * Camera: the desk top is at y=0; laptop at the origin; drawer front-right (x≈1.9, z≈1.2); bin bag on the floor right.
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  opened?: boolean;
  coins?: boolean;
  broken?: boolean;
  inDrawer?: boolean;
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

const LID_W = 2.2;
const LID_H = 1.45;
const BASE_D = 1.5;
const DRAWER: [number, number, number] = [2.15, -0.42, 2.12]; // drawer front (desk front edge is z≈2.1)
const BAG: [number, number, number] = [4.1, -0.62, 2.6];

export const Laptop3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [1.2, 2.6, 5.6], look: [0.6, 0.1, 0.3], fov: 34});

  // ---- textures ----
  const wood = useMemo(
    () =>
      tex(1024, 512, (g) => {
        g.fillStyle = '#5a3b22';
        g.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 160; i++) {
          const y = rand(i) * 512;
          g.strokeStyle = `rgba(${30 + rand(i + 1) * 40},${18 + rand(i + 2) * 20},8,${0.25 + rand(i + 3) * 0.35})`;
          g.lineWidth = 1 + rand(i + 4) * 3;
          g.beginPath();
          g.moveTo(0, y);
          for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 90 + i) * 6 * rand(i + 5));
          g.stroke();
        }
      }),
    [],
  );
  const keys = useMemo(
    () =>
      tex(1024, 512, (g) => {
        g.fillStyle = '#1b1e23';
        g.fillRect(0, 0, 1024, 512);
        for (let r = 0; r < 5; r++)
          for (let k = 0; k < 14; k++) {
            g.fillStyle = '#2b3038';
            g.fillRect(40 + k * 68 + (r % 2) * 18, 30 + r * 64, 58, 54);
            g.fillStyle = 'rgba(255,255,255,0.08)';
            g.fillRect(40 + k * 68 + (r % 2) * 18, 30 + r * 64, 58, 6);
          }
        g.fillStyle = '#2b3038';
        g.fillRect(260, 352, 480, 54);
        g.fillStyle = '#23272e';
        g.fillRect(380, 420, 260, 80);
      }),
    [],
  );
  const lines = useMemo(() => Array.from({length: 40}).map((_, i) => `[${String(i).padStart(2, '0')}:14] hash ${(Math.floor(rand(i) * 1e8)).toString(16)}… ${i % 7 === 3 ? 'BLOCK FOUND +50 BTC' : 'working'}`), []);
  const screenTex = useMemo(() => tex(1024, 640, () => {}), []);
  // redraw the screen each frame (mining log scroll)
  const mineS = since('mine');
  const spillS = since('spill');
  const openP = props.opened || props.broken ? 1 : has('open') ? p('open', 22, Easing.inOut(Easing.cubic)) : 0;
  const dead = spillS >= 0 && (spillS > 26 || (spillS > 10 && Math.floor(spillS / 3) % 2 === 0));
  if (screenTex) {
    const g = (screenTex.image as HTMLCanvasElement).getContext('2d')!;
    g.fillStyle = dead ? '#020304' : '#06121a';
    g.fillRect(0, 0, 1024, 640);
    if (!dead && openP > 0.5) {
      g.font = '600 30px "DejaVu Sans Mono", monospace';
      const scroll = mineS >= 0 ? Math.floor(mineS / 3) : 0;
      for (let k = 0; k < 14; k++) {
        const ln = lines[(k + scroll) % lines.length];
        g.fillStyle = ln.includes('BLOCK') ? '#ffcf5a' : '#5fe3a8';
        g.fillText(ln, 30, 60 + k * 42);
      }
      g.fillStyle = '#3bc9ee';
      g.font = '800 40px Inter, "DejaVu Sans", Arial, sans-serif';
      g.fillText(mineS >= 0 ? 'bitcoin — mining' : 'bitcoin', 30, 625);
    }
    screenTex.needsUpdate = true;
  }

  // ---- materials ----
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({map: wood ?? undefined, roughness: 0.62, metalness: 0}), [wood]);
  const shellMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#b9c0c8', metalness: 0.95, roughness: 0.3, clearcoat: 0.3}), []);
  const keysMat = useMemo(() => new THREE.MeshStandardMaterial({map: keys ?? undefined, roughness: 0.7}), [keys]);
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({map: screenTex ?? undefined, toneMapped: false}), [screenTex]);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#dff3ff', transmission: 0, transparent: true, opacity: 0.28, roughness: 0.05, clearcoat: 1, depthWrite: false}), []);
  const drinkMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#e9a83a', transparent: true, opacity: 0.78, roughness: 0.05, clearcoat: 1, metalness: 0}), []);
  const coinMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#E8A93C', metalness: 1, roughness: 0.25, clearcoat: 0.6, emissive: new THREE.Color('#5a3200'), emissiveIntensity: 0.3}), []);
  const boardMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#1f5a3a', roughness: 0.5, transparent: true}), []);
  const battMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#2a2e35', roughness: 0.4, transparent: true}), []);
  const drawerMat = useMemo(() => new THREE.MeshStandardMaterial({map: wood ?? undefined, color: '#c9a37e', roughness: 0.6}), [wood]);
  const handleMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#d6dbe0', metalness: 1, roughness: 0.2}), []);
  const bagMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#0d0f12', roughness: 0.28, clearcoat: 0.9, metalness: 0}), []);
  const sparkMat = useMemo(() => glowMat('#bfe9ff', 3), []);
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(0.12, 0.12, 0.035, 32), []);
  const baseGeo = useMemo(() => new RoundedBoxGeometry(LID_W, 0.09, BASE_D, 4, 0.03), []);
  const lidGeo = useMemo(() => new RoundedBoxGeometry(LID_W, LID_H, 0.05, 4, 0.02), []);
  const bagGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.75, 36, 28);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const w = 1 + 0.06 * Math.sin(x * 9 + y * 5) + 0.05 * Math.sin(z * 11 - y * 3);
      pos.setXYZ(i, x * w, y * (y > 0 ? 1.25 : 0.95) * w, z * w);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // ---- timeline ----
  const spillP = p('spill', 16, Easing.in(Easing.quad));
  const flood = interpolate(spillS, [8, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const partsP = props.broken ? 1 : p('parts', 24, Easing.out(Easing.cubic));
  const drawerS = since('drawer');
  const bagS = since('bag');
  // drawer slide: out → (drive drops) → in
  const drawerOut = props.inDrawer && bagS < 0
    ? 0
    : drawerS >= 0
      ? interpolate(drawerS, [0, 10, 24, 34], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : bagS >= 0
        ? interpolate(bagS, [0, 10, 30, 40], [0, 1, 1, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        : 0;
  // drive path
  const onDesk = new THREE.Vector3(0, 0.55, 0.15);
  // drive resting inside the drawer, in world space for a given drawer travel (0 shut … 1 out)
  const inDrawerAt = (out: number) => new THREE.Vector3(DRAWER[0], DRAWER[1] + 0.02, DRAWER[2] - 0.75 + out * 0.9);
  const inDrawer = inDrawerAt(1);
  const inBag = new THREE.Vector3(BAG[0], BAG[1] + 0.2, BAG[2]);
  let drive = onDesk.clone();
  let driveVis = partsP > 0.2 || props.broken || props.inDrawer;
  if (props.inDrawer && bagS < 0) drive = inDrawerAt(0);
  if (drawerS >= 0) {
    const t = interpolate(drawerS, [4, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    drive = onDesk.clone().lerp(inDrawer, t);
    drive.y += Math.sin(t * Math.PI) * 0.5;
    if (t >= 1) drive = inDrawerAt(drawerOut);
  }
  if (bagS >= 0) {
    const out = inDrawerAt(interpolate(bagS, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    const t = interpolate(bagS, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    drive = out.clone().lerp(inBag, t);
    drive.y += Math.sin(t * Math.PI) * 1.4;
    driveVis = t < 0.97;
  }
  const bagClose = bagS >= 0 ? interpolate(bagS, [30, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const driveGlow = partsP > 0 && drawerS < 0 && bagS < 0 && !props.inDrawer ? 0.6 + 0.2 * Math.sin(frame / 7) : 0;
  boardMat.opacity = battMat.opacity = 1 - interpolate(partsP, [0.5, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const laptopFade = 1 - interpolate(partsP, [0.55, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // coins from mining
  const nCoins = 46;
  const coinEls = Array.from({length: nCoins}).map((_, i) => {
    const t0 = i * 2.2;
    const age = props.coins ? 999 : mineS < 0 ? -1 : mineS - t0;
    if (age < 0) return null;
    const stack = i % 4;
    const level = Math.floor(i / 4);
    const rest = new THREE.Vector3(1.55 + (stack % 2) * 0.3 + (rand(i) - 0.5) * 0.03, 0.02 + level * 0.036, -0.35 + Math.floor(stack / 2) * 0.32);
    const from = new THREE.Vector3(0, 0.8, -0.4);
    const t = Math.min(1, age / 16);
    const pos = from.clone().lerp(rest, Easing.out(Easing.quad)(t));
    pos.y += Math.sin(t * Math.PI) * 0.9;
    return <mesh key={i} geometry={coinGeo} material={coinMat} position={pos} rotation={[t < 1 ? age * 0.4 : 0, rand(i) * 6, 0]} />;
  });

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  const lidAngle = -Math.PI / 2 + openP * (Math.PI / 2 + 0.32); // closed = flat on base
  const fly = (dx: number, dy: number, dz: number, r: number) => ({position: [dx * partsP, dy * partsP, dz * partsP] as [number, number, number], rotation: [r * partsP, r * 0.6 * partsP, r * 0.3 * partsP] as [number, number, number]});

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.9} warm={0.35}>
      {/* desk */}
      <mesh material={woodMat} position={[0.9, -0.08, 0.3]}>
        <boxGeometry args={[7.5, 0.16, 3.6]} />
      </mesh>
      {/* drawer (under the desk front-right) */}
      <group position={[DRAWER[0], DRAWER[1], DRAWER[2] + drawerOut * 0.9]}>
        <mesh material={drawerMat}>
          <boxGeometry args={[1.5, 0.5, 0.06]} />
        </mesh>
        <mesh material={drawerMat} position={[0, -0.18, -0.75]}>
          <boxGeometry args={[1.42, 0.05, 1.5]} />
        </mesh>
        {[-0.7, 0.7].map((x, i) => (
          <mesh key={i} material={drawerMat} position={[x, 0, -0.75]}>
            <boxGeometry args={[0.04, 0.4, 1.5]} />
          </mesh>
        ))}
        <mesh material={handleMat} position={[0, 0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
        </mesh>
      </group>
      {/* bin bag on the floor */}
      <group position={BAG} scale={0.7}>
        <mesh geometry={bagGeo} material={bagMat} />
        <mesh material={bagMat} position={[0, 0.95 - bagClose * 0.1, 0]} scale={[1 - bagClose * 0.6, 1, 1 - bagClose * 0.6]}>
          <cylinderGeometry args={[0.18, 0.45, 0.4, 20, 1, true]} />
        </mesh>
        {bagClose > 0 ? (
          <mesh material={bagMat} position={[0, 1.18, 0]} scale={bagClose}>
            <torusKnotGeometry args={[0.08, 0.035, 48, 8]} />
          </mesh>
        ) : null}
      </group>
      {/* laptop */}
      {laptopFade > 0.01 && !props.broken && !props.inDrawer ? (
        <group position={[0, 0.045, 0]}>
          <group {...fly(-1.6, 1.2, -1.2, 1.3)}>
            <mesh geometry={baseGeo} material={shellMat} />
            <mesh material={keysMat} position={[0, 0.047, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.95, 0.98]} />
            </mesh>
          </group>
          {/* lid hinged at the back edge */}
          <group position={[0, 0.045, -BASE_D / 2]} rotation={[lidAngle, 0, 0]}>
            <group {...fly(0.4, 2.0, -1.6, -0.9)}>
              <mesh geometry={lidGeo} material={shellMat} position={[0, LID_H / 2, 0]} />
              <mesh material={screenMat} position={[0, LID_H / 2, 0.027]}>
                <planeGeometry args={[LID_W - 0.16, LID_H - 0.16]} />
              </mesh>
            </group>
          </group>
          {/* battery + board appear as it comes apart */}
          {partsP > 0 ? (
            <>
              <mesh material={battMat} {...fly(1.8, 1.0, -0.6, 1.6)}>
                <boxGeometry args={[1.0, 0.06, 0.4]} />
              </mesh>
              <mesh material={boardMat} {...fly(-1.2, 1.6, 0.8, -1.1)}>
                <boxGeometry args={[1.2, 0.03, 0.7]} />
              </mesh>
            </>
          ) : null}
          {/* spilled drink on the keys */}
          {flood > 0 ? (
            <mesh material={drinkMat} position={[0.25, 0.1, 0.25]} rotation={[-Math.PI / 2, 0, 0]} scale={[flood, flood * 0.8, 1]}>
              <circleGeometry args={[0.75, 40]} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      {/* glass */}
      {has('spill') || !props.broken ? (
        <group position={[1.35, 0, 0.55]} rotation={[0, 0, spillP * 1.45]}>
          <mesh material={glassMat} position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.17, 0.14, 0.64, 32, 1, true]} />
          </mesh>
          <mesh material={drinkMat} position={[0, 0.2 - spillP * 0.1, 0]} scale={[1, 1 - spillP * 0.85, 1]}>
            <cylinderGeometry args={[0.155, 0.135, 0.38, 32]} />
          </mesh>
        </group>
      ) : null}
      {/* pour stream */}
      {spillS >= 4 && spillS < 22 ? (
        <mesh material={drinkMat} position={[0.95, 0.25, 0.45]} rotation={[0, 0, 1.1]}>
          <cylinderGeometry args={[0.05, 0.09, 0.7, 12]} />
        </mesh>
      ) : null}
      {/* sparks when the screen dies */}
      {spillS > 10 && spillS < 34
        ? Array.from({length: 18}).map((_, i) => {
            const a = rand(i) * Math.PI * 2;
            const r = ((spillS - 10) / 24) * (0.4 + rand(i + 9) * 0.8);
            return (
              <mesh key={i} material={sparkMat} position={[Math.cos(a) * r, 0.2 + Math.abs(Math.sin(a)) * r * 0.8, 0.1 + Math.sin(a) * r * 0.5]} scale={0.03 * (1 - (spillS - 10) / 24)}>
                <sphereGeometry args={[1, 8, 8]} />
              </mesh>
            );
          })
        : null}
      {coinEls}
      {/* the laptop's hard drive */}
      {driveVis ? (
        <group position={drive} rotation={[0.25, 0.4 + frame * 0.006 * (drawerS < 0 && bagS < 0 ? 1 : 0), 0]} scale={0.55}>
          <HardDrive glow={driveGlow} />
        </group>
      ) : null}
      {/* floor */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#14161b" roughness={1} />
      </mesh>
    </Studio>
  );
};

/**
 * HardDrive3D — the generic 3.5" drive on its own, slowly turning, with an optional sticker on the cover
 * (e.g. "BITCOIN KEY · DO NOT BIN"). actions: drive (spins in) | sticker (sticker slaps on) | label:<n> | cam
 */
type HP = {actions?: string[]; cam?: Cam[]; tags?: Tag[]; caption?: string; sticker?: string};

export const HardDrive3D: React.FC<SceneProps<HP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 2.6, 4.6], look: [0, -0.2, 0], fov: 32});
  const inP = has('drive') ? p('drive', 20, Easing.out(Easing.back(1.3))) : 1;
  const stP = p('sticker', 10, Easing.out(Easing.back(2)));
  const sticker = useMemo(
    () =>
      tex(1024, 400, (g) => {
        g.fillStyle = '#ffcf3a';
        g.fillRect(0, 0, 1024, 400);
        g.strokeStyle = '#111';
        g.lineWidth = 14;
        g.strokeRect(14, 14, 996, 372);
        g.fillStyle = '#111';
        g.textAlign = 'center';
        g.font = '900 120px Inter, "DejaVu Sans", Arial, sans-serif';
        const [a, b] = (props.sticker ?? 'BITCOIN KEY|DO NOT BIN').split('|');
        g.fillText(a, 512, 170);
        g.font = '800 96px Inter, "DejaVu Sans", Arial, sans-serif';
        g.fillText(b ?? '', 512, 310);
      }),
    [props.sticker],
  );
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  return (
    <Studio cam={cam} overlay={<><Tags tags={props.tags ?? []} show={tagShow} />{props.caption ? <Caption text={props.caption} /> : null}</>} bloom={0.9}>
      <group rotation={[0.35, -0.5 + (1 - inP) * 2.5 + Math.sin(frame / 50) * 0.12, 0]} scale={1.5 * inP}>
        <HardDrive glow={0.35 + 0.15 * Math.sin(frame / 8)} />
        {stP > 0 ? (
          <mesh position={[-0.02, 0.14, 0.3]} rotation={[-Math.PI / 2, 0, 0.05]} scale={[stP, stP, 1]}>
            <planeGeometry args={[0.8, 0.31]} />
            <meshStandardMaterial map={sticker ?? undefined} roughness={0.6} />
          </mesh>
        ) : null}
      </group>
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#0a101b" roughness={1} />
      </mesh>
    </Studio>
  );
};

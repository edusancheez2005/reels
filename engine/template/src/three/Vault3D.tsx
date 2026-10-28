import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Caption, Studio, Tags, useCamera, useClock, glowMat, rand, type Cam, type Tag} from './kit';

/**
 * Vault3D — "your coins sit in a vault only your private key opens".
 * A gunmetal safe with a thick glass door (so the coins stay visible), a pile of gold ₿-style coins inside,
 * and a gold key. Generic, unbranded; use for keys / self-custody / lost-coins beats.
 *
 * actions (one per beat):
 *   build      safe drops in, coins settle
 *   key        the key appears, floating in front (glow)
 *   turn       key flies into the keyhole, turns; the door swings open
 *   move       a few coins lift out and fly off to the right (coins moving)
 *   lose       key pulls out, tumbles away and breaks into sparks; door swings shut
 *   lock       frost spreads over the glass, an ice-blue ring locks around the keyhole
 *   scan       a light sweep crosses the glass and the coins glint (public: anyone can see them)
 *   try        the door rattles; keyhole flashes amber (can't be opened)
 *   label:<n>  show tag n        cam   (no-op beat for cam[])
 * props: coins (default 48), opened, keyGone, frozen (state from an earlier scene), plate (text on the safe's top plate), tags, caption, cam
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  coins?: number;
  opened?: boolean;
  keyGone?: boolean;
  frozen?: boolean;
  plate?: string;
  /** overall size of the safe (default 0.62) */
  scale?: number;
};

const GOLD = '#E8A93C';
const ICE = '#bfe3ff';
const AMBER = '#FFB547';
const W = 2.3;
const H = 2.1;
const D = 1.7;
const T = 0.14; // wall thickness
const Y0 = 0;
const KEYHOLE: [number, number, number] = [W / 2 - 0.36, 0, D / 2 + 0.17];

const plateTexture = (text: string) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 160;
  const g = c.getContext('2d')!;
  g.fillStyle = '#20262e';
  g.fillRect(0, 0, 1024, 160);
  g.strokeStyle = '#8b96a3';
  g.lineWidth = 6;
  g.strokeRect(10, 10, 1004, 140);
  g.fillStyle = '#d9e1ea';
  g.font = '800 84px Inter, "DejaVu Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 512, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const frostTexture = () => {
  if (typeof document === 'undefined') return null;
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(220,240,255,0.25)';
  g.fillRect(0, 0, S, S);
  // feathery frost: random branching strokes
  for (let k = 0; k < 90; k++) {
    let x = rand(k) * S;
    let y = rand(k + 99) * S;
    let a = rand(k + 7) * Math.PI * 2;
    g.strokeStyle = `rgba(255,255,255,${0.25 + 0.5 * rand(k + 3)})`;
    g.lineWidth = 0.6 + rand(k + 5) * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 10; s++) {
      a += (rand(k * 13 + s) - 0.5) * 1.2;
      x += Math.cos(a) * 14;
      y += Math.sin(a) * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** A gold key: ring bow, shaft, bit with teeth. Points along +x from the bow; shaft tip at x≈1.05. */
const Key: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <mesh material={mat}>
      <torusGeometry args={[0.2, 0.06, 20, 48]} />
    </mesh>
    <mesh material={mat} position={[0.25, 0, 0]}>
      <boxGeometry args={[0.12, 0.13, 0.08]} />
    </mesh>
    <mesh material={mat} position={[0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.8, 20]} />
    </mesh>
    {[0.82, 0.92, 1.0].map((x, i) => (
      <mesh key={i} material={mat} position={[x, -0.07 - (i % 2) * 0.03, 0]}>
        <boxGeometry args={[0.06, 0.1 + (i % 2) * 0.06, 0.06]} />
      </mesh>
    ))}
  </group>
);

export const Vault3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, at, since} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [1.6, 1.0, 8.6], look: [0, 0.1, 0], fov: 32});

  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#3a434f', metalness: 0.9, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3}), []);
  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#1b2430', metalness: 0.5, roughness: 0.6, side: THREE.BackSide}), []);
  const trimMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#aab4bf', metalness: 1, roughness: 0.22}), []);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#cfe8ff', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide}), []);
  const frostTex = useMemo(() => frostTexture(), []);
  const frostMat = useMemo(() => new THREE.MeshBasicMaterial({map: frostTex ?? undefined, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false}), [frostTex]);
  const coinMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: GOLD, metalness: 1, roughness: 0.27, clearcoat: 0.6}), []);
  const keyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#F2C45A', metalness: 1, roughness: 0.2, clearcoat: 0.8, emissive: new THREE.Color('#7a4a00'), emissiveIntensity: 0.35}), []);
  const iceRing = useMemo(() => glowMat(ICE, 2.4), []);
  const amberRing = useMemo(() => glowMat(AMBER, 2.6), []);
  const sparkMat = useMemo(() => glowMat('#FFD27A', 3), []);
  const scanMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#bfefff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false}), []);
  const plateTex = useMemo(() => (props.plate ? plateTexture(props.plate) : null), [props.plate]);
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(0.17, 0.17, 0.05, 40), []);

  // ---- timeline ----
  const buildP = acts.includes('build') ? p('build', 22, Easing.out(Easing.back(1.2))) : 1;
  const keyIn = props.keyGone ? 0 : acts.includes('key') ? p('key', 14, Easing.out(Easing.back(1.6))) : acts.includes('turn') ? 1 : 0;
  const turnP = p('turn', 26, Easing.inOut(Easing.cubic));
  const openP = props.opened ? 1 : interpolate(turnP, [0.65, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const loseP = p('lose', 34, Easing.in(Easing.quad));
  const shutP = p('lose', 16, Easing.inOut(Easing.cubic));
  const doorOpen = Math.max(0, openP - shutP * (props.opened || turnP > 0 ? 1 : 0));
  const lockP = props.frozen ? 1 : p('lock', 30, Easing.out(Easing.cubic));
  const moveP = p('move', 34, Easing.inOut(Easing.cubic));
  const scanS = since('scan');
  const tryS = since('try');
  const rattle = tryS >= 0 && tryS < 26 ? Math.sin(tryS * 1.9) * 0.035 * (1 - tryS / 26) : 0;
  const tryFlash = tryS >= 0 ? Math.max(0, 1 - Math.abs(tryS - 6) / 14) : 0;

  // key pose: floating in front → keyhole (turn) → flies away (lose)
  const hover: [number, number, number] = [W / 2 + 0.2, 0.75, D / 2 + 0.9];
  const inHole: [number, number, number] = [KEYHOLE[0], KEYHOLE[1], KEYHOLE[2] - 0.12];
  const away: [number, number, number] = [W / 2 + 3.2, Y0 + 3.0, D / 2 + 0.6];
  const kp = new THREE.Vector3(...hover).lerp(new THREE.Vector3(...inHole), interpolate(turnP, [0, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  if (props.opened && turnP === 0) kp.set(...inHole);
  kp.lerp(new THREE.Vector3(...away), loseP);
  const keyTwist = interpolate(turnP, [0.55, 0.8], [0, Math.PI / 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) + loseP * 7;
  const keyBob = Math.sin(frame / 14) * 0.05 * (1 - turnP);
  const keyScale = keyIn * (1 - interpolate(loseP, [0.7, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const keyGlow = 0.35 + 0.25 * Math.sin(frame / 6) * (1 - turnP);
  keyMat.emissiveIntensity = keyGlow;

  frostMat.opacity = 0.42 * lockP;
  glassMat.opacity = 0.16 + 0.12 * lockP;
  scanMat.opacity = scanS >= 0 ? 0.55 * Math.max(0, 1 - Math.abs(scanS - 20) / 20) : 0;
  const scanY = scanS >= 0 ? interpolate(scanS, [0, 40], [Y0 - H / 2, Y0 + H / 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : -99;
  coinMat.emissive = new THREE.Color('#ffcf6a');
  coinMat.emissiveIntensity = scanS >= 0 ? 0.6 * Math.max(0, 1 - Math.abs(scanS - 22) / 18) : 0;

  // coin pile inside
  const nCoins = props.coins ?? 48;
  const coins = useMemo(() => {
    const out: {x: number; y: number; z: number; r: number}[] = [];
    const cols = 4;
    const rows = 3;
    for (let i = 0; i < nCoins; i++) {
      const s = i % (cols * rows);
      const k = Math.floor(i / (cols * rows));
      const cx = ((s % cols) - (cols - 1) / 2) * 0.42;
      const cz = (Math.floor(s / cols) - (rows - 1) / 2) * 0.38;
      out.push({x: cx + (rand(i) - 0.5) * 0.04, y: Y0 - H / 2 + T + 0.03 + k * 0.052, z: cz + (rand(i + 50) - 0.5) * 0.04, r: rand(i + 9) * 6});
    }
    return out;
  }, [nCoins]);
  const movers = 5;

  // sparks when the key breaks
  const sparkN = 26;
  const sparkT = interpolate(loseP, [0.72, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sparkAge = since('lose') - 24;

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  return (
    <Studio cam={cam} overlay={overlay} bloom={1}>
      <group scale={props.scale ?? 0.62}>
      <group position={[0, (1 - buildP) * 3, 0]} rotation={[0, -0.18, rattle]}>
        {/* body: rounded shell + dark interior */}
        {/* open-front shell: back, sides, top, bottom */}
        {[
          [0, 0, -D / 2 + T / 2, W, H, T],
          [-W / 2 + T / 2, 0, 0, T, H, D],
          [W / 2 - T / 2, 0, 0, T, H, D],
          [0, H / 2 - T / 2, 0, W, T, D],
          [0, -H / 2 + T / 2, 0, W, T, D],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`w${i}`} material={bodyMat} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ))}
        {/* dark interior lining */}
        <mesh material={innerMat} position={[0, 0, 0]}>
          <boxGeometry args={[W - 2 * T - 0.01, H - 2 * T - 0.01, D - 0.02]} />
        </mesh>
        {/* front frame */}
        {[
          [0, H / 2 - T / 2, W, T],
          [0, -H / 2 + T / 2, W, T],
          [-W / 2 + T / 2, 0, T, H],
          [W / 2 - T / 2, 0, T, H],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} material={trimMat} position={[x, Y0 + y - Y0 + 0, D / 2 + 0.02]}>
            <boxGeometry args={[w, h, 0.05]} />
          </mesh>
        ))}
        {/* coins */}
        {coins.map((c, i) => {
          const mv = i >= coins.length - movers ? moveP : 0;
          const j = i - (coins.length - movers);
          const fly = mv > 0 ? new THREE.Vector3(c.x + mv * (2.6 + j * 0.3), c.y - Y0 + mv * (1.3 + j * 0.25) + Math.sin(mv * Math.PI) * 0.6, c.z + mv * (1.9 - j * 0.2)) : null;
          return (
            <mesh
              key={i}
              geometry={coinGeo}
              material={coinMat}
              position={fly ? [fly.x, fly.y + Y0 - Y0, fly.z] : [c.x, c.y - Y0, c.z]}
              rotation={[mv * 3, c.r + mv * 5, mv * 2]}
              scale={mv > 0.85 ? 1 - (mv - 0.85) / 0.15 : 1}
            />
          );
        })}
        {/* top plate */}
        {plateTex ? (
          <mesh position={[0, H / 2 + 0.002, D / 2 - 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.6, 0.25]} />
            <meshStandardMaterial map={plateTex} metalness={0.6} roughness={0.4} />
          </mesh>
        ) : null}
        {/* door: hinged on the left edge */}
        <group position={[-W / 2 + 0.04, 0, D / 2 + 0.06]} rotation={[0, -doorOpen * 1.75 + rattle * 0.6, 0]}>
          <group position={[W / 2 - 0.04, 0, 0]}>
            <mesh material={glassMat}>
              <boxGeometry args={[W - 0.12, H - 0.12, 0.09]} />
            </mesh>
            <mesh material={frostMat} position={[0, 0, 0.05]}>
              <planeGeometry args={[W - 0.16, H - 0.16]} />
            </mesh>
            {/* door frame bars */}
            {[
              [0, H / 2 - 0.1, W - 0.08, 0.1],
              [0, -H / 2 + 0.1, W - 0.08, 0.1],
              [-W / 2 + 0.1, 0, 0.1, H - 0.08],
              [W / 2 - 0.1, 0, 0.1, H - 0.08],
            ].map(([x, y, w, h], i) => (
              <mesh key={i} material={trimMat} position={[x, y, 0.02]}>
                <boxGeometry args={[w, h, 0.12]} />
              </mesh>
            ))}
            {/* lock plate + keyhole */}
            <mesh material={trimMat} position={[KEYHOLE[0], KEYHOLE[1] - Y0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 48]} />
            </mesh>
            <mesh position={[KEYHOLE[0], KEYHOLE[1] - Y0 + 0.02, 0.115]}>
              <circleGeometry args={[0.045, 24]} />
              <meshBasicMaterial color="#05070a" />
            </mesh>
            <mesh position={[KEYHOLE[0], KEYHOLE[1] - Y0 - 0.04, 0.115]}>
              <planeGeometry args={[0.035, 0.09]} />
              <meshBasicMaterial color="#05070a" />
            </mesh>
            {lockP > 0 ? (
              <mesh material={iceRing} position={[KEYHOLE[0], KEYHOLE[1] - Y0, 0.13]} scale={0.6 + 0.4 * lockP}>
                <torusGeometry args={[0.27, 0.022, 16, 64]} />
              </mesh>
            ) : null}
            {tryFlash > 0 ? (
              <mesh material={amberRing} position={[KEYHOLE[0], KEYHOLE[1] - Y0, 0.14]} scale={1 + tryFlash * 0.3}>
                <torusGeometry args={[0.32, 0.02 * tryFlash + 0.004, 16, 64]} />
              </mesh>
            ) : null}
            {/* handle */}
            <mesh material={trimMat} position={[KEYHOLE[0], KEYHOLE[1] - Y0 - 0.5, 0.16]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.42, 20]} />
            </mesh>
          </group>
        </group>
      {/* key (world space) */}
        {keyScale > 0.001 ? (
          <group position={[kp.x, kp.y + keyBob, kp.z]} rotation={[0.15 * (1 - turnP) + loseP * 2, Math.PI / 2 - 0.35 * (1 - turnP), loseP * 1.5]} scale={keyScale}>
            <group rotation={[keyTwist, 0, 0]}>
              <group position={[-1.04, 0, 0]}>
                <Key mat={keyMat} />
              </group>
            </group>
          </group>
        ) : null}
        {sparkT > 0 && sparkAge < 40
          ? Array.from({length: sparkN}).map((_, i) => {
              const a = rand(i) * Math.PI * 2;
              const e = rand(i + 30) * Math.PI - Math.PI / 2;
              const r = (0.3 + rand(i + 60) * 1.4) * Math.max(0, sparkAge) / 30;
              const s = 0.04 * Math.max(0, 1 - Math.max(0, sparkAge) / 40);
              return (
                <mesh key={i} material={sparkMat} position={[away[0] + Math.cos(a) * Math.cos(e) * r, away[1] + Math.sin(e) * r - 0.002 * sparkAge * sparkAge, away[2] + Math.sin(a) * Math.cos(e) * r]} scale={s}>
                  <sphereGeometry args={[1, 8, 8]} />
                </mesh>
              );
            })
          : null}
        {/* scan sweep across the glass */}
        {scanMat.opacity > 0 ? (
          <mesh material={scanMat} position={[0, scanY - Y0, D / 2 + 0.22]}>
            <planeGeometry args={[W + 0.5, 0.05]} />
          </mesh>
        ) : null}
      </group>
      </group>
      {/* floor */}
      <mesh position={[0, (Y0 - H / 2) * (props.scale ?? 0.62) - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#0a101b" metalness={0} roughness={1} />
      </mesh>
    </Studio>
  );
};

/**
 * Drive3D — a generic encrypted USB drive (unbranded) with 10 attempt lights on its face.
 * actions: drive (slides in, spins to face camera) | ten (the 10 lights switch on, white, one by one)
 *          | lockout (ghost padlock + frost: what happens after 10 wrong tries) | used (first `used` lights turn amber, one by one)
 *          | left (the remaining lights pulse) | label:<n> | cam
 * props: used (default 8), tags, caption, cam
 */
type DP = {actions?: string[]; cam?: Cam[]; tags?: Tag[]; caption?: string; used?: number; on?: boolean};

export const Drive3D: React.FC<SceneProps<DP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 0.3, 8.2], look: [0, 0, 0], fov: 30});
  const used = props.used ?? 8;
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#23272e', metalness: 0.85, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.25}), []);
  const steelMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#c9d0d8', metalness: 1, roughness: 0.18}), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#0b0d10', roughness: 0.6}), []);
  const offMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#39414c', metalness: 0.2, roughness: 0.4}), []);
  const whiteMat = useMemo(() => glowMat('#e9f6ff', 2.2), []);
  const amberMat = useMemo(() => glowMat(AMBER, 2.8), []);
  const lockMat = useMemo(() => new THREE.MeshStandardMaterial({color: ICE, emissive: new THREE.Color(ICE), emissiveIntensity: 1.2, transparent: true, opacity: 0, toneMapped: false, depthWrite: false}), []);
  const bodyGeo = useMemo(() => new RoundedBoxGeometry(3.0, 0.92, 0.36, 5, 0.16), []);

  const driveP = acts.includes('drive') ? p('drive', 26, Easing.out(Easing.cubic)) : 1;
  const tenS = since('ten');
  const usedS = since('used');
  const lockP = p('lockout', 14, Easing.out(Easing.back(1.4)));
  const lockFade = since('lockout') >= 0 ? interpolate(since('lockout'), [0, 14, 40, 60], [0, 1, 1, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const leftS = since('left');
  lockMat.opacity = 0.75 * lockFade;

  const rotY = (1 - driveP) * -2.2 + Math.sin(frame / 50) * 0.08;
  const x0 = (1 - driveP) * -5;
  const lights = Array.from({length: 10}).map((_, i) => {
    const lx = -1.1 + i * 0.235;
    const isOn = props.on || (tenS >= 0 && tenS >= i * 2);
    const isUsed = i < used && usedS >= 0 && usedS >= i * 3;
    const pulse = !isUsed && leftS >= 0 ? 1 + 0.25 * Math.abs(Math.sin(leftS / 5)) : 1;
    return (
      <mesh key={i} material={isUsed ? amberMat : isOn ? whiteMat : offMat} position={[lx, -0.12, 0.185]} scale={[pulse, pulse, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.03, 24]} />
      </mesh>
    );
  });

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  return (
    <Studio cam={cam} overlay={<><Tags tags={props.tags ?? []} show={tagShow} />{props.caption ? <Caption text={props.caption} /> : null}</>} bloom={1}>
      <group position={[x0, 0, 0]} rotation={[0.12, rotY, 0]}>
        <mesh geometry={bodyGeo} material={bodyMat} />
        {/* metal connector */}
        <mesh material={steelMat} position={[-1.85, 0, 0]}>
          <boxGeometry args={[0.75, 0.56, 0.2]} />
        </mesh>
        {[-0.1, 0.1].map((y, i) => (
          <mesh key={i} material={darkMat} position={[-1.95, y, 0.101]}>
            <planeGeometry args={[0.18, 0.1]} />
          </mesh>
        ))}
        {/* key ring loop */}
        <mesh material={steelMat} position={[1.62, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.16, 0.035, 12, 32]} />
        </mesh>
        {/* face inlay */}
        <mesh position={[0.05, 0.16, 0.182]}>
          <planeGeometry args={[2.5, 0.22]} />
          <meshStandardMaterial color="#14181d" metalness={0.4} roughness={0.5} />
        </mesh>
        {lights}
      </group>
      {/* ghost padlock (illustration of lock-out) */}
      {lockP > 0 ? (
        <group position={[0, 0.95, 0.4]} scale={0.55 * lockP}>
          <mesh material={lockMat}>
            <boxGeometry args={[0.8, 0.62, 0.22]} />
          </mesh>
          <mesh material={lockMat} position={[0, 0.31, 0]}>
            <torusGeometry args={[0.27, 0.07, 16, 40, Math.PI]} />
          </mesh>
        </group>
      ) : null}
    </Studio>
  );
};

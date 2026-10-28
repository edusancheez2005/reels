import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {CANVAS, Caption, Studio, Tags, useCamera, useClock, glowMat, rand, type Cam, type Tag} from './kit';

/**
 * Coin3D — a detailed gold coin (embossed ₿ currency sign, reeded edge, PBR gold) for "will it go up or down?"
 * beats, and a supply chart: 21 stacks of coins (3 rows × 7), each stack = total / 21.
 *
 * actions (one per beat):
 *   spin        fast spin that settles face-on
 *   up / down   glowing arrows grow above-right (green, "Up?") / below-left (red, "Down?")
 *   ask         both arrows pulse and the coin rocks like a balance
 *   ghost       21 glass stacks rise: the maximum supply
 *   cap         a glowing ceiling at the max + its label (props.capText)
 *   stack       gold coins fill the stacks up to `value`, the counter runs with them
 *   focus       the unfilled part of the last stack pulses + its label (props.focusText)
 *   lost        frost sweeps over `lost` coins' worth of stacks (front row first): coins that can't move;
 *               the counter switches to the lost amount (props.lostText = line under it, props.lostUnit)
 *   label:<n>   show tag n          cam   (no-op beat for cam[])
 * props: value, total (21,000,000), unit, sub, legend, capText, focusText, upText, downText,
 *        coin ("hero" | "none"), arrows (bool: arrows already up), tags, caption, cam
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  value?: number;
  total?: number;
  unit?: string;
  sub?: string;
  legend?: string;
  capText?: string;
  focusText?: string;
  upText?: string;
  downText?: string;
  coin?: 'hero' | 'none';
  arrows?: boolean;
  /** start with the stacks already filled to `value` (no `stack` beat needed) */
  filled?: boolean;
  /** number of coins (same unit as value) shown as frozen/lost by the `lost` action */
  lost?: number;
  lostText?: string;
  /** start with the lost coins already frozen */
  lostOn?: boolean;
};

const GOLD = '#E8A93C';
const UP = '#00e08a';
const DOWN = '#ff5b6b';
const ACC = '#3bc9ee';
const ICE = '#bfe3ff';
/** fill order for lost coins: front row first (most visible), left to right */
const LOST_ORDER = [14, 15, 16, 17, 18, 19, 20, 7, 8, 9, 10, 11, 12, 13, 0, 1, 2, 3, 4, 5, 6];

// chart geometry (world units)
const COLS = 7;
const ROWS = 3;
const SP = 0.33;
const R = 0.14;
const PER = 16;
const STEP = 0.058;
const BASE = -0.75;
const H = PER * STEP;
const ROWZ = 0.4;
const stackPos = (c: number): [number, number] => {
  const row = Math.floor(c / COLS); // 0 = back
  const col = c % COLS;
  return [(col - (COLS - 1) / 2) * SP, (row - (ROWS - 1) / 2) * ROWZ];
};

type CamS = {pos: THREE.Vector3; look: THREE.Vector3; fov: number};
const project = (cam: CamS, v: [number, number, number]): [number, number] => {
  const c = new THREE.PerspectiveCamera(cam.fov, CANVAS.w / CANVAS.h, 0.01, 200);
  c.position.copy(cam.pos);
  c.lookAt(cam.look);
  c.setViewOffset(CANVAS.w, CANVAS.h, 0, -CANVAS.shift, CANVAS.w, CANVAS.h);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const p = new THREE.Vector3(...v).project(c);
  return [((p.x + 1) / 2) * CANVAS.w, ((1 - p.y) / 2) * CANVAS.h];
};

const useFaceTexture = () =>
  useMemo(() => {
    if (typeof document === 'undefined') return {map: null as THREE.Texture | null, bump: null as THREE.Texture | null};
    const S = 1024;
    const mk = (bump: boolean) => {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d')!;
      const cx = S / 2;
      const grd = g.createRadialGradient(cx * 0.75, cx * 0.65, 40, cx, cx, cx);
      grd.addColorStop(0, bump ? '#7a7a7a' : '#F4B54A');
      grd.addColorStop(1, bump ? '#5c5c5c' : '#9A5B12');
      g.fillStyle = grd;
      g.fillRect(0, 0, S, S);
      for (let r = 40; r < cx; r += 5) {
        g.strokeStyle = bump ? `rgba(255,255,255,${0.03 + 0.04 * rand(r)})` : `rgba(255,236,190,${0.04 + 0.06 * rand(r)})`;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cx, r, 0, Math.PI * 2);
        g.stroke();
      }
      g.lineWidth = 40;
      g.strokeStyle = bump ? '#ffffff' : '#F7C15A';
      g.beginPath();
      g.arc(cx, cx, cx - 26, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 9;
      g.beginPath();
      g.arc(cx, cx, cx - 100, 0, Math.PI * 2);
      g.stroke();
      for (let k = 0; k < 90; k++) {
        const a = (k / 90) * Math.PI * 2;
        g.fillStyle = bump ? '#ffffff' : '#F9CB6A';
        g.beginPath();
        g.arc(cx + Math.cos(a) * (cx - 66), cx + Math.sin(a) * (cx - 66), 7, 0, Math.PI * 2);
        g.fill();
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `900 ${Math.round(S * 0.56)}px Inter, "DejaVu Sans", Arial, sans-serif`;
      if (!bump) {
        g.fillStyle = 'rgba(80,42,0,0.6)';
        g.fillText('₿', cx + 12, cx + 26);
      }
      g.fillStyle = bump ? '#ffffff' : '#FAC65C';
      g.fillText('₿', cx, cx + 12);
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8;
      if (!bump) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return {map: mk(false), bump: mk(true)};
  }, []);

const useEdgeTexture = () =>
  useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 16;
    const g = c.getContext('2d')!;
    for (let x = 0; x < 1024; x += 6) {
      g.fillStyle = '#ffffff';
      g.fillRect(x, 0, 3, 16);
      g.fillStyle = '#444444';
      g.fillRect(x + 3, 0, 3, 16);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }, []);

const HeroCoin: React.FC = () => {
  const face = useFaceTexture();
  const edge = useEdgeTexture();
  const mats = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({color: GOLD, envMapIntensity: 1.5, metalness: 1, roughness: 0.3, bumpMap: edge ?? undefined, bumpScale: 0.05, clearcoat: 0.3});
    const top = new THREE.MeshPhysicalMaterial({color: '#FFE6AE', envMapIntensity: 1.6, map: face.map ?? undefined, bumpMap: face.bump ?? undefined, bumpScale: 0.07, metalness: 1, roughness: 0.24, clearcoat: 0.6, clearcoatRoughness: 0.18});
    return [side, top, top];
  }, [face, edge]);
  return (
    <mesh material={mats} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.74, 0.74, 0.11, 128, 1, false]} />
    </mesh>
  );
};

const Arrow: React.FC<{dir: 1 | -1; color: string; p: number; pulse: number; x: number; y: number}> = ({dir, color, p, pulse, x, y}) => {
  const mat = useMemo(() => glowMat(color, 2.2), [color]);
  if (p <= 0) return null;
  const s = 0.56 * (1 + 0.07 * pulse);
  return (
    <group position={[x, y, 0]} scale={[s, s * dir * p, s]}>
      <mesh material={mat} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 1.0, 24]} />
      </mesh>
      <mesh material={mat} position={[0, 1.25, 0]}>
        <coneGeometry args={[0.34, 0.5, 32]} />
      </mesh>
    </group>
  );
};

const Label: React.FC<{xy: [number, number]; text: string; color: string; p: number; size?: number}> = ({xy, text, color, p, size = 52}) =>
  p <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left: xy[0] - 400,
        width: 800,
        top: xy[1] - size * 0.6,
        textAlign: 'center',
        fontFamily: theme.font,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -1,
        color,
        opacity: p,
        transform: `scale(${0.8 + 0.2 * p})`,
        textShadow: '0 4px 24px rgba(0,0,0,0.85)',
        whiteSpace: 'pre',
        lineHeight: 1.1,
      }}
    >
      {text}
    </div>
  );

export const Coin3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, at} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 0.25, 9.5], look: [0, 0.25, 0], fov: 30});
  const total = props.total ?? 21_000_000;
  const value = props.value ?? 0;
  const hero = props.coin !== 'none';

  // ---- hero coin ----
  const spinAt = at('spin');
  const spinP = p('spin', 36, Easing.out(Easing.cubic));
  const rotY = (spinAt !== null ? spinP * Math.PI * 6 : 0) + Math.sin(frame / 60) * 0.32;
  const upP = props.arrows ? 1 : p('up', 14, Easing.out(Easing.back(1.4)));
  const downP = props.arrows ? 1 : p('down', 14, Easing.out(Easing.back(1.4)));
  const askAt = at('ask');
  const asking = askAt !== null && frame >= askAt;
  const pulse = asking ? Math.abs(Math.sin((frame - askAt!) / 5)) : 0;
  const rock = asking ? Math.sin((frame - askAt!) / 7) * 0.16 * Math.min(1, (frame - askAt!) / 10) : 0;
  const bob = Math.sin(frame / 22) * 0.04;

  // ---- chart ----
  const ghostP = p('ghost', 24, Easing.out(Easing.cubic));
  const capP = p('cap', 16, Easing.out(Easing.cubic));
  const stackP = props.filled ? 1 : p('stack', 48, Easing.inOut(Easing.cubic));
  const lostP = props.lostOn ? 1 : p('lost', 30, Easing.inOut(Easing.cubic));
  const lostStacks = ((props.lost ?? 0) / total) * COLS * ROWS;
  const focusAt = at('focus');
  const focusP = p('focus', 12);
  const focusPulse = focusAt !== null && frame >= focusAt ? 0.5 + 0.5 * Math.sin((frame - focusAt) / 5) : 0;
  const chartOn = acts.includes('ghost') || acts.includes('stack') || !!props.filled;
  const filled = (value / total) * COLS * ROWS;
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(R, R, STEP * 0.86, 40), []);
  const coinMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: GOLD, metalness: 1, roughness: 0.28, clearcoat: 0.5}), []);
  const iceMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#8fb6d6', metalness: 0.35, roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.6, emissive: new THREE.Color('#3c6f99'), emissiveIntensity: 0.35}), []);
  const iceShell = useMemo(() => new THREE.MeshPhysicalMaterial({color: ICE, transparent: true, opacity: 0.22, roughness: 0.2, metalness: 0, clearcoat: 1, depthWrite: false, emissive: new THREE.Color(ICE), emissiveIntensity: 0.25}), []);
  const ghostMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#9fdcff', metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.16, depthWrite: false}), []);
  const ghostEdge = useMemo(() => new THREE.LineBasicMaterial({color: ACC, transparent: true, opacity: 0.55}), []);
  const ghostEdgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(R + 0.012, R + 0.012, H, 24, 1, true), 1), []);
  const focusMat = useMemo(() => new THREE.MeshStandardMaterial({color: ACC, emissive: new THREE.Color(ACC), emissiveIntensity: 1, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false}), []);
  const capMat = useMemo(() => new THREE.MeshBasicMaterial({color: ACC, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide}), []);
  const capEdgeMat = useMemo(() => glowMat(ACC, 2.4), []);
  const gridW = (COLS - 1) * SP + 2 * R + 0.12;
  const gridD = (ROWS - 1) * ROWZ + 2 * R + 0.12;
  const capY = BASE + H + 0.02;

  const nodes: React.ReactNode[] = [];
  if (chartOn) {
    for (let c = 0; c < COLS * ROWS; c++) {
      const [x, z] = stackPos(c);
      const colFill = Math.max(0, Math.min(1, filled - c));
      const n = Math.max(colFill > 0 ? 1 : 0, Math.round(PER * colFill));
      // ghost (max supply) rises with a small stagger
      const gp = interpolate(ghostP, [(c / 21) * 0.5, (c / 21) * 0.5 + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      if (gp > 0) {
        nodes.push(
          <group key={`g${c}`} position={[x, BASE + (H * gp) / 2, z]} scale={[1, Math.max(0.001, gp), 1]}>
            <mesh material={ghostMat}>
              <cylinderGeometry args={[R + 0.01, R + 0.01, H, 32]} />
            </mesh>
            <lineSegments geometry={ghostEdgeGeo} material={ghostEdge} />
          </group>,
        );
      }
      // gold fill, stack by stack
      const grow = interpolate(stackP, [(c / 21) * 0.7, (c / 21) * 0.7 + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const shown = Math.round(n * grow);
      const li = LOST_ORDER.indexOf(c);
      const stackLost = Math.max(0, Math.min(1, lostStacks - li)); // share of this stack that is lost
      const sweep = lostP * lostStacks - li; // >0 once the frost has reached this stack
      const lostN = Math.round(n * stackLost);
      const frozenK = sweep <= 0 ? 0 : Math.min(lostN, Math.round(lostN * Math.min(1, sweep * 1.5)));
      if (frozenK > 0) {
        const h = frozenK * STEP + 0.03;
        nodes.push(
          <mesh key={`ice${c}`} material={iceShell} position={[x, BASE + h / 2, z]}>
            <cylinderGeometry args={[R + 0.035, R + 0.035, h, 32]} />
          </mesh>,
        );
      }
      for (let k = 0; k < shown; k++) {
        nodes.push(
          <mesh key={`${c}-${k}`} geometry={coinGeo} material={k < frozenK ? iceMat : coinMat} position={[x + (rand(c * 31 + k) - 0.5) * 0.018, BASE + STEP * (k + 0.5), z + (rand(c * 17 + k) - 0.5) * 0.018]} rotation={[0, rand(c + k * 7) * 6, 0]} />,
        );
      }
      // the unmined remainder of a partial stack
      if (focusP > 0 && colFill > 0 && colFill < 1) {
        const h = (PER - n) * STEP;
        nodes.push(
          <mesh key={`f${c}`} material={focusMat} position={[x, BASE + n * STEP + h / 2, z]} scale={[1 + 0.05 * focusPulse, 1, 1 + 0.05 * focusPulse]}>
            <cylinderGeometry args={[R + 0.02, R + 0.02, h, 32]} />
          </mesh>,
        );
      }
    }
  }
  const partial = Math.min(COLS * ROWS - 1, Math.floor(filled));
  const [px, pz] = stackPos(partial);

  // ---- overlay ----
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const heroY = 0.25 + bob;
  const overlay = (
    <>
      {hero ? (
        <>
          <Label xy={project(cam, [0.8, heroY + 1.12, 0])} text={props.upText ?? 'UP?'} color={UP} p={upP} />
          <Label xy={project(cam, [-0.8, heroY - 1.1, 0])} text={props.downText ?? 'DOWN?'} color={DOWN} p={downP} />
        </>
      ) : null}
      {chartOn && lostP > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: theme.font, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.9)'}}>
          <div style={{fontSize: 108, fontWeight: 800, letterSpacing: -4, fontVariantNumeric: 'tabular-nums', color: ICE}}>≈{Math.round(((props.lost ?? 0) * Math.min(1, lostP * 1.15)) / 1000) * 1000 > 0 ? (Math.round(((props.lost ?? 0) * Math.min(1, lostP * 1.15)) / 1000) * 1000).toLocaleString('en-US') : '0'}</div>
          <div style={{fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 4}}>{props.lostText ?? 'lost'}</div>
          {props.sub ? <div style={{fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>{props.sub}</div> : null}
        </div>
      ) : null}
      {chartOn && (acts.includes('stack') || props.filled) && stackP > 0 && lostP <= 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: theme.font, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.9)'}}>
          <div style={{fontSize: 108, fontWeight: 800, letterSpacing: -4, fontVariantNumeric: 'tabular-nums', color: GOLD}}>{Math.round(value * stackP).toLocaleString('en-US')}</div>
          <div style={{fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 4}}>
            of {total.toLocaleString('en-US')} {props.unit ?? ''}
          </div>
          {props.sub ? <div style={{fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 10}}>{props.sub}</div> : null}
        </div>
      ) : null}
      {chartOn && capP > 0 ? <Label xy={project(cam, [0, capY + 0.2, -gridD / 2])} text={props.capText ?? `${total.toLocaleString('en-US')} max`} color={ACC} p={capP} size={44} /> : null}
      {chartOn && focusP > 0 && props.focusText ? (
        <Label xy={((xy) => [Math.min(xy[0], 820), Math.min(xy[1], 1440)] as [number, number])(project(cam, [Math.min(px, 0.7), BASE - 0.32, pz + 0.3]))} text={props.focusText} color="#ffffff" p={focusP} size={36} />
      ) : null}
      {chartOn && props.legend && ghostP > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', fontFamily: theme.font, fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.6)', opacity: ghostP}}>{props.legend}</div>
      ) : null}
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  return (
    <Studio cam={cam} overlay={overlay} bloom={1.0}>
      {hero ? (
        <>
          <group position={[0, heroY, 0]} rotation={[0.06, rotY, rock]}>
            <HeroCoin />
          </group>
          <Arrow dir={1} color={UP} p={upP} pulse={pulse} x={0.98} y={heroY} />
          <Arrow dir={-1} color={DOWN} p={downP} pulse={pulse} x={-0.98} y={heroY} />
        </>
      ) : null}
      {nodes}
      {chartOn && capP > 0 ? (
        <group position={[0, capY, 0]} scale={[capP, 1, capP]}>
          <mesh material={capMat} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[gridW, gridD]} />
          </mesh>
          {[
            [0, -gridD / 2, gridW, 0.018],
            [0, gridD / 2, gridW, 0.018],
            [-gridW / 2, 0, 0.018, gridD],
            [gridW / 2, 0, 0.018, gridD],
          ].map(([x, z, w, d], i) => (
            <mesh key={i} material={capEdgeMat} position={[x, 0, z]}>
              <boxGeometry args={[w, 0.018, d]} />
            </mesh>
          ))}
        </group>
      ) : null}
      {chartOn ? (
        <mesh position={[0, BASE - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gridW + 1.2, gridD + 1.0]} />
          <meshStandardMaterial color="#09111e" metalness={0.5} roughness={0.45} />
        </mesh>
      ) : null}
    </Studio>
  );
};

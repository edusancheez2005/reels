import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {useFrame} from '@react-three/fiber';
import {interpolate, Easing} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {Studio, Tags, Caption, useClock, useCamera, rand, clamp01, type Cam, type Tag} from './kit';

/**
 * Pool3D: a mempool as a glowing pool of glass transaction cubes, coloured by fee rate (low = deep blue,
 * high = amber). Reusable for any "pending transactions / block building / bots watching" beat.
 *
 * actions (fired on beat i, like Cell3D):
 *   fill      cubes rain into the pool (otherwise it starts full)
 *   count     the counter (props.value) lands
 *   send      "your" transaction flies in from the camera to its slot (white, outlined)
 *   sort      cubes lift by fee rate (a fee terrain: highest fee rates on top)
 *   block     the top `blockSize` cubes fly up and pack into a new block
 *   chain     the new block links to the chain (previous blocks: props.chain)
 *   wait      your cube pulses amber (stuck at a low fee)
 *   bump      your cube's fee jumps (turns hot, lifts if sorted)
 *   bots      red watcher drones appear, each with a beam reading cubes
 *   scan      a red scan plane sweeps across the whole pool
 *   big       a large gold "big trade" cube drops into the front lane
 *   sandA/sandB  bot cubes slide in before / after the big trade (the sandwich)
 *   copy      a red clone peels off the big trade;  jump: the clone moves ahead of it in the lane
 *   label:<n> show tag n;  cam: no-op beat for cam[]
 * props: actions, cam, tags, caption, value, suffix, sub, chain (bool: show previous blocks from the start),
 *        cloneOn (bool: clone already out), packed (bool: block already built), you (bool: show your cube from the start), botsOn (bool: drones from the start), sorted (bool), blockSize
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  value?: number;
  suffix?: string;
  sub?: string;
  chain?: boolean;
  you?: boolean;
  botsOn?: boolean;
  sorted?: boolean;
  bigOn?: boolean;
  cloneOn?: boolean;
  packed?: boolean;
  blockSize?: number;
};

const C = 16;
const R = 10;
const SP = 0.4;
const S = 0.3;
const LANE_Z = 2.65;
const BLOCK = new THREE.Vector3(0, 3.0, -0.8);
const YOU_I = (R - 1) * C + 8; // front row, centre

const LOW = new THREE.Color('#1f3d78');
const MID = new THREE.Color('#3bc9ee');
const HIGH = new THREE.Color('#ffb547');
const feeColor = (f: number, out = new THREE.Color()) => (f < 0.5 ? out.copy(LOW).lerp(MID, f / 0.5) : out.copy(MID).lerp(HIGH, (f - 0.5) / 0.5));

export const Pool3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const clk = useClock(beats, acts);
  const {frame, p, at, has} = clk;
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 5.2, 8.6], look: [0, 0.4, 0], fov: 34});
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));

  // counter overlay (same look as Swarm3D)
  const cAt = at('count');
  const value = props.value ?? 0;
  const ct = cAt === null ? 1 : interpolate(frame, [cAt - 26, cAt], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const land = cAt === null ? 0 : interpolate(frame, [cAt - 2, cAt + 6], [1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const overlay = (
    <>
      {props.value && cAt !== null && frame >= cAt - 28 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontFamily: theme.font}}>
          <div style={{fontSize: 168, fontWeight: 800, color: '#fff', letterSpacing: -6, textShadow: '0 10px 60px rgba(0,0,0,0.9), 0 0 40px rgba(59,201,238,0.55)', transform: `scale(${land})`, fontVariantNumeric: 'tabular-nums'}}>
            {Math.round(value * ct).toLocaleString('en-US')}
            {props.suffix ? <span style={{fontSize: 70, marginLeft: 12}}>{props.suffix}</span> : null}
          </div>
          {props.sub ? (
            <div style={{fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textAlign: 'center', whiteSpace: 'pre-line', maxWidth: 900, lineHeight: 1.3, textShadow: '0 4px 20px rgba(0,0,0,0.95)', opacity: interpolate(frame, [cAt, cAt + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
              {props.sub}
            </div>
          ) : null}
        </div>
      ) : null}
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  return (
    <Studio cam={cam} bloom={0.9} overlay={overlay}>
      <fog attach="fog" args={['#070b12', 10, 30]} />
      <Basin />
      <Cubes clk={clk} props={props} />
      <Chain clk={clk} props={props} />
      <Specials clk={clk} props={props} />
      {has('bots') || props.botsOn ? <Bots clk={clk} on={props.botsOn ? 1 : p('bots', 20, Easing.out(Easing.cubic))} /> : null}
      {has('scan') ? <ScanPlane x={interpolate(frame, [at('scan') ?? 0, (at('scan') ?? 0) + 40], [-4.2, 4.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} on={p('scan', 6) * (1 - clamp01(clk.since('scan') / 46 - 0.85) * 6)} /> : null}
    </Studio>
  );
};

type Clk = ReturnType<typeof useClock>;

/** The pool: a dark glass basin with a glowing rim and a faint grid floor. */
const Basin: React.FC = () => {
  const w = C * SP + 0.5;
  const d = R * SP + 0.5;
  const rim = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.3, d)), [w, d]);
  return (
    <group position={[0, -0.16, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[w, 0.3, d]} />
        <meshStandardMaterial color="#0b1424" metalness={0.6} roughness={0.25} />
      </mesh>
      <lineSegments geometry={rim}>
        <lineBasicMaterial color="#3bc9ee" transparent opacity={0.55} toneMapped={false} />
      </lineSegments>
      <gridHelper args={[w * 3, 36, '#16304f', '#0e1d33']} position={[0, -0.16, 0]} />
    </group>
  );
};

const useSlots = () =>
  useMemo(() => {
    const out: {x: number; z: number; f: number; d: number}[] = [];
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const i = r * C + c;
        const f = i === YOU_I ? 0.04 : Math.pow(rand(i * 3.7 + 1), 1.7);
        out.push({x: (c - (C - 1) / 2) * SP, z: (r - (R - 1) / 2) * SP, f, d: rand(i * 9.1 + 4)});
      }
    return out;
  }, []);

/** indices of the top-K fee cubes (excluding yours), and their packed slot inside the block */
const useBlockPick = (slots: ReturnType<typeof useSlots>, K: number) =>
  useMemo(() => {
    const idx = slots.map((s, i) => [s.f, i] as [number, number]).filter(([, i]) => i !== YOU_I).sort((a, b) => b[0] - a[0]).slice(0, K).map(([, i]) => i);
    const pos = new Map<number, THREE.Vector3>();
    idx.forEach((i, k) => {
      const gx = k % 4;
      const gy = Math.floor(k / 4) % 3;
      const gz = Math.floor(k / 12);
      pos.set(i, new THREE.Vector3(BLOCK.x + (gx - 1.5) * 0.3, BLOCK.y + (gy - 1) * 0.3, BLOCK.z + (gz - 0.5) * 0.3));
    });
    return pos;
  }, [slots, K]);

const Cubes: React.FC<{clk: Clk; props: P}> = ({clk, props}) => {
  const {frame, p, at, has, since} = clk;
  const body = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new RoundedBoxGeometry(S, S, S, 2, 0.05), []);
  const slots = useSlots();
  const pick = useBlockPick(slots, props.blockSize ?? 24);
  const apply = () => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const fillAt = at('fill');
    const sort = props.sorted ? 1 : p('sort', 26);
    const blk = props.packed ? 1 : p('block', 30);
    const scanAt = at('scan');
    const scanX = scanAt === null ? 99 : interpolate(frame, [scanAt, scanAt + 40], [-4.2, 4.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const botsOn = props.botsOn || has('bots') ? (props.botsOn ? 1 : p('bots', 20)) : 0;
    slots.forEach((s, i) => {
      let y = S / 2;
      let scale = 1;
      // rain in
      if (fillAt !== null) {
        const t0 = fillAt + s.d * 26;
        const t = interpolate(frame, [t0, t0 + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
        y += (1 - t) * 6;
        scale = t <= 0 ? 0.0001 : 1;
        if (t >= 1) y += Math.max(0, Math.sin((frame - t0 - 14) / 3) * 0.06 * Math.exp(-(frame - t0 - 14) / 8));
      }
      if (i === YOU_I && (has('send') || props.you)) scale = 0.0001; // drawn by Specials
      y += sort * s.f * 1.5;
      // idle bob
      y += Math.sin(frame / 18 + s.d * 20) * 0.02;
      o.position.set(s.x, y, s.z);
      o.rotation.set(0, 0, 0);
      const target = pick.get(i);
      if (target && blk > 0) {
        const tt = clamp01(blk * 1.4 - s.d * 0.4);
        const from = o.position.clone();
        const mid = from.clone().lerp(target, 0.5).add(new THREE.Vector3(0, 1.2, 0));
        const a = from.clone().lerp(mid, tt);
        const b = mid.clone().lerp(target, tt);
        o.position.copy(a.lerp(b, tt));
        scale *= 1 - 0.12 * tt;
        o.rotation.set(tt * Math.PI * 2 * (s.d - 0.5), tt * Math.PI * 2, 0);
      }
      o.scale.setScalar(scale);
      o.updateMatrix();
      body.current?.setMatrixAt(i, o.matrix);
      o.scale.setScalar(scale * 0.62);
      o.updateMatrix();
      core.current?.setMatrixAt(i, o.matrix);
      feeColor(s.f, col);
      // flashes: scan plane / bots reading
      let flash = 0;
      if (scanAt !== null) flash = Math.max(flash, Math.exp(-Math.abs(o.position.x - scanX) * 3) * (since('scan') < 50 ? 1 : 0));
      if (botsOn > 0) {
        const slot = Math.floor(frame / 14);
        for (let k = 0; k < 3; k++) if (Math.floor(rand(slot * 7 + k * 13) * slots.length) === i) flash = Math.max(flash, botsOn);
      }
      if (flash > 0) col.lerp(new THREE.Color('#b77bff'), flash * 0.85);
      body.current?.setColorAt(i, col);
      core.current?.setColorAt(i, col.clone().multiplyScalar(1.6 + flash * 1.5));
    });
    [body, core].forEach((r) => {
      if (!r.current) return;
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  };
  useFrame(apply);
  useLayoutEffect(apply);
  return (
    <group>
      <instancedMesh ref={body} args={[geo, undefined, slots.length]} frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.42} metalness={0.1} roughness={0.15} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={core} args={[geo, undefined, slots.length]} frustumCulled={false}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

/** Previous blocks (left) + the new block's frame and link. */
const Chain: React.FC<{clk: Clk; props: P}> = ({clk, props}) => {
  const {p, has} = clk;
  const show = props.chain ? 1 : Math.max(p('block', 16), has('chain') ? 1 : 0);
  const frameIn = props.packed ? 1 : p('block', 30);
  const link = p('chain', 20);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.35, 1.05, 0.75)), []);
  if (show <= 0 && frameIn <= 0) return null;
  const prev = [-2.1, -4.2, -6.3];
  return (
    <group>
      {prev.map((x, k) => (
        <group key={k} position={[BLOCK.x + x, BLOCK.y, BLOCK.z]} scale={show}>
          <mesh>
            <boxGeometry args={[1.35, 1.05, 0.75]} />
            <meshStandardMaterial color="#173457" metalness={0.4} roughness={0.3} emissive="#3bc9ee" emissiveIntensity={0.18} transparent opacity={0.9} />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#3bc9ee" toneMapped={false} />
          </lineSegments>
          <mesh position={[0.95, 0, 0]}>
            <boxGeometry args={[0.55, 0.06, 0.06]} />
            <meshBasicMaterial color="#3bc9ee" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {(props.chain || props.packed || has('block') || has('chain')) && (frameIn > 0 || props.chain) ? (
        <group position={BLOCK.toArray()}>
          <lineSegments geometry={edges} scale={0.6 + 0.4 * (props.chain && !has('block') ? 1 : frameIn)}>
            <lineBasicMaterial color={link > 0 ? '#ffffff' : '#3bc9ee'} transparent opacity={0.4 + 0.6 * Math.max(frameIn, link)} toneMapped={false} />
          </lineSegments>
          <mesh position={[-1.05, 0, 0]} scale={[link, 1, 1]}>
            <boxGeometry args={[0.55, 0.08, 0.08]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

const Glow: React.FC<{size: number; color: string; pos: THREE.Vector3; scale?: number; outline?: string; rot?: number; intensity?: number}> = ({size, color, pos, scale = 1, outline, rot = 0, intensity = 2}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(size, size, size, 2, size * 0.16), [size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(size * 1.12, size * 1.12, size * 1.12)), [size]);
  if (scale <= 0.001) return null;
  return (
    <group position={pos.toArray()} scale={scale} rotation={[0, rot, 0]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} transparent opacity={0.55} roughness={0.15} depthWrite={false} />
      </mesh>
      <mesh geometry={geo} scale={0.64}>
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(intensity)} toneMapped={false} />
      </mesh>
      {outline ? (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={outline} toneMapped={false} />
        </lineSegments>
      ) : null}
    </group>
  );
};

/** Your transaction, the big trade, the sandwich bots and the clone. */
const Specials: React.FC<{clk: Clk; props: P}> = ({clk, props}) => {
  const {frame, p, has, since} = clk;
  const slots = useSlots();
  const s = slots[YOU_I];
  const sort = props.sorted ? 1 : p('sort', 26);
  // ---- you
  const showYou = props.you || has('send');
  const send = has('send') ? p('send', 22, Easing.out(Easing.cubic)) : 1;
  const bump = p('bump', 22);
  const fee = 0.04 + bump * 0.9;
  const slot = new THREE.Vector3(s.x, S / 2 + sort * fee * 1.5 + bump * 0.6, s.z);
  const from = new THREE.Vector3(0, 3.2, 6.5);
  const youPos = from.clone().lerp(slot, send);
  youPos.y += Math.sin(frame / 18) * 0.02;
  const waitOn = has('wait') && since('wait') >= 0 && bump === 0 ? 1 : 0;
  const pulse = waitOn ? 0.5 + 0.5 * Math.sin(since('wait') / 3.2) : 0;
  const youCol = bump > 0 ? '#ffb547' : waitOn ? new THREE.Color('#ffffff').lerp(new THREE.Color('#ffb547'), pulse).getStyle() : '#ffffff';
  // ---- big trade + sandwich + copy
  const big = props.bigOn ? 1 : p('big', 20, Easing.out(Easing.bounce));
  const jump = p('jump', 24);
  const bigPos = new THREE.Vector3(0.0 + jump * 0.5, 0.42 + (1 - big) * 5, LANE_Z);
  const sa = p('sandA', 18, Easing.out(Easing.cubic));
  const sb = p('sandB', 18, Easing.out(Easing.cubic));
  const aPos = new THREE.Vector3(-0.8 - (1 - sa) * 5, 0.3, LANE_Z);
  const bPos = new THREE.Vector3(0.8 + (1 - sb) * 5, 0.3, LANE_Z);
  const cp = props.cloneOn ? 1 : p('copy', 22, Easing.out(Easing.cubic));
  const clonePos = bigPos.clone().add(new THREE.Vector3(-jump * 1.55, cp * 1.0 * (1 - jump) + 0, 0));
  clonePos.y = 0.42 + cp * 0.9 * (1 - jump);
  const showBig = has('big') || props.bigOn;
  return (
    <group>
      {showYou ? <Glow size={S * 1.15} color={youCol} pos={youPos} scale={has('send') ? (since('send') < 0 ? 0 : 1) : 1} outline="#ffffff" rot={bump * Math.PI * 2} intensity={1.4} /> : null}
      {showYou && (has('send') ? since('send') >= 0 : true) ? (
        <mesh position={[youPos.x, 0.005, youPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 48]} />
          <meshBasicMaterial color={youCol} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      ) : null}
      {showBig ? (
        <>
          <mesh position={[0, 0.01, LANE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.6, 0.9]} />
            <meshBasicMaterial color="#3bc9ee" transparent opacity={0.08 * big} toneMapped={false} />
          </mesh>
          <Glow size={0.56} color="#ffc94a" pos={bigPos} scale={big > 0.01 ? 1 : 0} outline="#fff3c4" rot={frame * 0.01} />
        </>
      ) : null}
      {has('sandA') ? <Glow size={0.4} color="#a46bff" pos={aPos} scale={sa > 0 ? 1 : 0} outline="#e3cfff" /> : null}
      {has('sandB') ? <Glow size={0.4} color="#a46bff" pos={bPos} scale={sb > 0 ? 1 : 0} outline="#e3cfff" /> : null}
      {has('copy') || props.cloneOn ? <Glow size={0.56} color="#a46bff" pos={clonePos} scale={cp > 0.01 ? cp : 0} outline="#e3cfff" rot={-frame * 0.01} /> : null}
    </group>
  );
};

/** Red watcher drones hovering over the pool, each reading a cube with a beam. */
const Bots: React.FC<{clk: Clk; on: number}> = ({clk, on}) => {
  const {frame} = clk;
  const slots = useSlots();
  if (on <= 0) return null;
  const drones = [0, 1, 2].map((k) => {
    const a = frame / 60 + (k * Math.PI * 2) / 3;
    return new THREE.Vector3(Math.cos(a) * 2.4, 2.1 + Math.sin(frame / 20 + k) * 0.12 + (1 - on) * 3, Math.sin(a) * 1.2 - 0.2);
  });
  const slot = Math.floor(frame / 14);
  return (
    <group>
      {drones.map((d, k) => {
        const ti = Math.floor(rand(slot * 7 + k * 13) * slots.length);
        const t = slots[ti];
        const target = new THREE.Vector3(t.x, S, t.z);
        const mid = d.clone().lerp(target, 0.5);
        const len = d.distanceTo(target);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().sub(d).normalize());
        return (
          <group key={k}>
            <group position={d.toArray()} rotation={[0, frame * 0.05, 0]}>
              <mesh>
                <octahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color="#1a0f2e" metalness={0.8} roughness={0.25} emissive="#9b5cff" emissiveIntensity={0.4} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.32, 0.025, 8, 40]} />
                <meshBasicMaterial color="#b77bff" toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.12, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color={new THREE.Color('#b77bff').multiplyScalar(3)} toneMapped={false} />
              </mesh>
            </group>
            <mesh position={mid.toArray()} quaternion={q}>
              <cylinderGeometry args={[0.012, 0.05, len, 8, 1, true]} />
              <meshBasicMaterial color="#b77bff" transparent opacity={0.55 * on} toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const ScanPlane: React.FC<{x: number; on: number}> = ({x, on}) => {
  if (on <= 0) return null;
  return (
    <group position={[x, 0.9, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[R * SP + 1, 2.2]} />
        <meshBasicMaterial color="#b77bff" transparent opacity={0.16 * on} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[0.03, 0.03, R * SP + 1]} />
        <meshBasicMaterial color={new THREE.Color('#b77bff').multiplyScalar(2.5)} toneMapped={false} />
      </mesh>
    </group>
  );
};

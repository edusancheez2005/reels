import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {interpolate, Easing} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Studio, Tags, Caption, useClock, useCamera, useSoftTexture, rand, clamp01, type Cam, type Tag} from './kit';

/**
 * Magnified cross-section of a lithium-ion cell: copper foil | graphite sheets | liquid + porous separator |
 * metal-oxide lattice | aluminium foil, with lithium ions (blue, bloom), electrons (gold) and an outer wire.
 * Actions (fire on beats):
 *   build     layers fly in            charge / discharge   ions cross; electrons run the outer wire
 *   split     the highlighted atom drops its electron (it leaves up the copper foil)
 *   block     an electron flies at the separator and bounces off (red ring)
 *   pass      the highlighted ion slips through a pore
 *   pierce    a metal burr grows from the oxide side through the separator
 *   short     electrons pour through the hole; the hole glows
 *   heat      everything shifts to heat: orange glow, separator shrinks back, smoke
 *   wire      draw the outer wire       focusL / focusR / focusWall   dim everything else
 *   label:<n> tags[n]                   cam   (a beat for camera moves)
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  ions?: 'anode' | 'cathode';
  ionStart?: number;
  dur?: number;
  wire?: boolean;
  hole?: boolean;
  heat0?: number;
};

const NI = 18;
const SEP_X = 0;
const anodeSlot = (i: number) => new THREE.Vector3(-2.35 + (i % 3) * 0.72, -1.0 + Math.floor(i / 3) * 0.4, -0.55 + ((i * 7) % 3) * 0.55);
const cathodeSlot = (i: number) => new THREE.Vector3(0.75 + (i % 3) * 0.72, -1.0 + Math.floor(i / 3) * 0.4, -0.55 + ((i * 5) % 3) * 0.55);

const WIRE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.95, 1.45, 0),
  new THREE.Vector3(-2.95, 2.35, 0),
  new THREE.Vector3(-1.6, 2.95, 0),
  new THREE.Vector3(0, 3.05, 0),
  new THREE.Vector3(1.6, 2.95, 0),
  new THREE.Vector3(2.95, 2.35, 0),
  new THREE.Vector3(2.95, 1.45, 0),
]);

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

const graphiteTex = () =>
  tex(512, 512, (g) => {
    g.fillStyle = '#1b1d22';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(150,160,180,0.35)';
    g.lineWidth = 2;
    const r = 18;
    for (let row = 0; row < 20; row++)
      for (let col = 0; col < 12; col++) {
        const cx = col * r * 3 + (row % 2) * r * 1.5;
        const cy = row * r * 0.87;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k;
          g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        g.closePath();
        g.stroke();
      }
  });

const poreTex = () =>
  tex(512, 512, (g) => {
    g.fillStyle = 'rgba(235,240,248,0.9)';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = 'rgba(40,60,90,0.55)';
      g.beginPath();
      g.ellipse(rand(i) * 512, rand(i + 3) * 512, 2 + rand(i + 5) * 5, 1 + rand(i + 7) * 3, rand(i + 9) * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = 1;
      g.beginPath();
      const y = rand(i + 40) * 512;
      g.moveTo(0, y);
      g.bezierCurveTo(170, y + 8, 340, y - 8, 512, y + 4);
      g.stroke();
    }
  });

const Lattice: React.FC<{dim: number; heat: number}> = ({dim, heat}) => {
  const metal = useRef<THREE.InstancedMesh>(null);
  const oxy = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(() => {
    const m: THREE.Vector3[] = [];
    const o: THREE.Vector3[] = [];
    for (let x = 0; x < 6; x++)
      for (let y = 0; y < 8; y++)
        for (let z = 0; z < 5; z++) {
          const v = new THREE.Vector3(0.45 + x * 0.42, -1.4 + y * 0.4, -0.85 + z * 0.42);
          ((x + y + z) % 2 === 0 ? m : o).push(v);
        }
    return {m, o};
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    pts.m.forEach((v, i) => {
      d.position.copy(v);
      d.updateMatrix();
      metal.current?.setMatrixAt(i, d.matrix);
    });
    pts.o.forEach((v, i) => {
      d.position.copy(v);
      d.updateMatrix();
      oxy.current?.setMatrixAt(i, d.matrix);
    });
    if (metal.current) metal.current.instanceMatrix.needsUpdate = true;
    if (oxy.current) oxy.current.instanceMatrix.needsUpdate = true;
  }, [pts]);
  return (
    <group>
      <instancedMesh ref={metal} args={[undefined, undefined, pts.m.length]}>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshPhysicalMaterial color="#8e96a6" metalness={0.85} roughness={0.25} clearcoat={0.6} transparent opacity={dim} emissive="#ff5a1f" emissiveIntensity={heat * 0.8} />
      </instancedMesh>
      <instancedMesh ref={oxy} args={[undefined, undefined, pts.o.length]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshPhysicalMaterial color="#d8433b" metalness={0.1} roughness={0.35} clearcoat={0.8} transparent opacity={dim} emissive="#ff5a1f" emissiveIntensity={heat * 0.8} />
      </instancedMesh>
    </group>
  );
};

export const Cell3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has, at} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [7.5, 2.4, 13], look: [0.3, -0.9, 0], fov: 36});
  const soft = useSoftTexture();
  const gTex = useMemo(() => graphiteTex(), []);
  const pTex = useMemo(() => poreTex(), []);

  const build = has('build') ? p('build', 34, Easing.out(Easing.cubic)) : 1;
  const heat = clamp01((props.heat0 ?? 0) + p('heat', 80, Easing.in(Easing.quad)));
  const wireOn = props.wire ? 1 : p('wire', 18);
  // focus: the most recent focus action wins (focusNone clears)
  const fx = ['focusL', 'focusR', 'focusWall', 'focusNone'].map((n) => ({n, f: at(n)})).filter((o) => o.f !== null && frame >= (o.f as number)).sort((a, b) => (a.f as number) - (b.f as number));
  const cur = fx.length ? fx[fx.length - 1] : null;
  const prev = fx.length > 1 ? fx[fx.length - 2] : null;
  const k = cur ? interpolate(frame, [cur.f as number, (cur.f as number) + 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 0;
  const fv = (n: string) => (cur?.n === n ? k : 0) + (prev?.n === n ? 1 - k : 0);
  const fL = fv('focusL');
  const fR = fv('focusR');
  const fW = fv('focusWall');
  const dimL = 1 - 0.75 * Math.max(fR, fW);
  const dimR = 1 - 0.75 * Math.max(fL, fW);
  const dimW = 1 - 0.6 * Math.max(fL, fR);
  const pierce = props.hole ? 1 : p('pierce', 22, Easing.out(Easing.cubic));
  const short = has('short') ? clamp01(since('short') / 12) : props.hole && has('heat') ? 1 : 0;

  // ---- ions ----
  const start0 = props.ionStart ?? (props.ions === 'anode' ? 1 : 0);
  const moves = acts.map((a, i) => ({a, f: (beats[i] ?? 0) - 2})).filter((m) => m.a === 'charge' || m.a === 'discharge');
  const DUR = props.dur ?? 40;
  const ionS = (i: number) => {
    let s = start0;
    for (const m of moves) {
      const to = m.a === 'charge' ? 1 : 0;
      const t = interpolate(frame, [m.f + i * 3, m.f + i * 3 + DUR], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
      s += (to - s) * t;
    }
    return s;
  };
  const ionPos = (i: number) => {
    const s = ionS(i);
    const a = cathodeSlot(i);
    const b = anodeSlot(i);
    const pore = new THREE.Vector3(SEP_X, (a.y + b.y) / 2 + (rand(i) - 0.5) * 0.3, (a.z + b.z) / 2);
    const v = s < 0.5 ? a.clone().lerp(pore, s * 2) : pore.clone().lerp(b, (s - 0.5) * 2);
    const w = Math.sin(Math.PI * s);
    v.y += Math.sin(frame / 6 + i) * 0.08 * w;
    v.z += Math.cos(frame / 7 + i * 2) * 0.08 * w;
    // settled ions breathe a little; "restless" ions strain toward the separator
    v.y += Math.sin(frame / 15 + i * 1.3) * 0.015;
    const rs = p('restless', 20);
    if (rs > 0) v.x += rs * (0.12 + 0.1 * Math.sin(frame / 3 + i * 2)) * (s > 0.5 ? 1 : -1);
    return v;
  };
  const charging = moves.length ? moves[moves.length - 1].a : null;
  const flowF = moves.length ? moves[moves.length - 1].f : 0;
  const flowing = charging !== null && frame > flowF && frame < flowF + DUR + NI * 3 + 20;

  // ---- split / block / pass ----
  const HI = 7;
  const split = p('split', 26, Easing.out(Easing.cubic));
  const splitOn = has('split');
  const blockT = since('block');
  const pass = p('pass', 40, Easing.inOut(Easing.cubic));
  const passOn = has('pass');

  const sep = new THREE.Color('#e8eef8').lerp(new THREE.Color('#ff7a2a'), heat);
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const hot = new THREE.Color('#ff5a1f');
  const shake = heat > 0.6 ? (rand(frame) - 0.5) * 0.04 * heat : 0;

  const bx = (k: number) => (1 - build) * (k * 3.5);

  return (
    <Studio cam={cam} bloom={1.1 + heat} warm={heat} aberration={heat * 0.002} overlay={<><Tags tags={props.tags ?? []} show={tagShow} />{props.caption ? <Caption text={props.caption} /> : null}</>}>
      <group position={[shake, 0, 0]}>
        {/* copper foil */}
        <mesh position={[-2.95 + bx(-1), 0, 0]}>
          <boxGeometry args={[0.08, 3.2, 2.2]} />
          <meshPhysicalMaterial color="#c8743f" metalness={1} roughness={0.28} clearcoat={0.5} transparent opacity={dimL} emissive={hot} emissiveIntensity={heat * 0.5} />
        </mesh>
        {/* graphite sheets */}
        <group position={[bx(-1), 0, 0]}>
          {Array.from({length: 7}, (_, k) => (
            <mesh key={k} position={[-1.6, -1.2 + k * 0.4, 0]}>
              <boxGeometry args={[2.5, 0.07, 2.0]} />
              <meshStandardMaterial map={gTex ?? undefined} color="#9aa2b3" metalness={0.35} roughness={0.55} transparent opacity={dimL} emissive={hot} emissiveIntensity={heat * 0.6} />
            </mesh>
          ))}
        </group>
        {/* electrolyte */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[5.8, 3.0, 2.0]} />
          <meshPhysicalMaterial color={new THREE.Color('#2a5cff').lerp(hot, heat)} transparent opacity={0.07 + heat * 0.08} roughness={0.1} depthWrite={false} />
        </mesh>
        {/* separator */}
        <group position={[SEP_X, bx(1) * 0.5, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 3.1 * (1 - heat * 0.25), 2.1 * (1 - heat * 0.25)]} />
            <meshPhysicalMaterial map={pTex ?? undefined} color={sep} transparent opacity={(0.6 - heat * 0.25) * dimW} roughness={0.6} emissive={sep} emissiveIntensity={0.15 + fW * 0.6 + heat} />
          </mesh>
          {/* glowing edge */}
          <mesh>
            <boxGeometry args={[0.075, 3.14 * (1 - heat * 0.25), 0.03]} />
            <meshBasicMaterial color={new THREE.Color('#7fb0ff').lerp(hot, heat)} toneMapped={false} transparent opacity={0.4 + 0.6 * fW} />
          </mesh>
          {/* hole */}
          {pierce > 0.6 ? (
            <mesh position={[0.04, 0.2, 0.3]} rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[0.12, 0.2 + short * 0.15 + heat * 0.4, 40]} />
              <meshBasicMaterial color={short > 0 ? '#ff8a3d' : '#ffd08a'} toneMapped={false} transparent opacity={clamp01((pierce - 0.6) * 3)} side={THREE.DoubleSide} />
            </mesh>
          ) : null}
        </group>
        {/* oxide lattice */}
        <group position={[bx(1), 0, 0]}>
          <Lattice dim={dimR} heat={heat} />
        </group>
        {/* aluminium foil */}
        <mesh position={[2.95 + bx(1), 0, 0]}>
          <boxGeometry args={[0.08, 3.2, 2.2]} />
          <meshPhysicalMaterial color="#d6d9df" metalness={1} roughness={0.22} clearcoat={0.5} transparent opacity={dimR} />
        </mesh>

        {/* burr */}
        {pierce > 0 ? (
          <mesh position={[2.0 - pierce * 1.4, 0.2, 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.16, 2.6, 6, 1]} />
            <meshPhysicalMaterial color="#c9ccd2" metalness={1} roughness={0.18} clearcoat={0.6} emissive={hot} emissiveIntensity={short * 0.8 + heat} flatShading />
          </mesh>
        ) : null}

        {/* outer wire + electrons */}
        {wireOn > 0 ? (
          <group>
            <mesh>
              <tubeGeometry args={[WIRE, 120, 0.035, 10, false]} />
              <meshPhysicalMaterial color="#d0a24a" metalness={1} roughness={0.25} emissive="#ffb547" emissiveIntensity={flowing ? 0.6 : 0.08} transparent opacity={wireOn} />
            </mesh>
            {flowing && !has('short')
              ? Array.from({length: 14}, (_, k) => {
                  const dir = charging === 'charge' ? -1 : 1;
                  const t = (((k / 14 + ((frame - flowF) / 60) * dir) % 1) + 1) % 1;
                  return (
                    <mesh key={k} position={WIRE.getPointAt(t)}>
                      <sphereGeometry args={[0.07, 16, 16]} />
                      <meshBasicMaterial color="#FFD45A" toneMapped={false} />
                    </mesh>
                  );
                })
              : null}
          </group>
        ) : null}

        {/* ions */}
        {Array.from({length: NI}, (_, i) => {
          const v = ionPos(i);
          const hi = i === HI && (splitOn || passOn);
          let pos = v;
          if (hi && passOn) {
            const a = anodeSlot(HI).clone().setX(-0.9);
            const b = cathodeSlot(HI).clone().setX(0.8);
            pos = a.clone().lerp(b, pass);
            pos.y = 0.2;
            pos.z = 0.3;
          }
          const s = hi ? 0.2 : 0.13;
          const heatCol = new THREE.Color('#5aa0ff').lerp(new THREE.Color('#ff8a3d'), heat);
          return (
            <group key={i} position={pos}>
              <mesh>
                <sphereGeometry args={[s, 24, 24]} />
                <meshStandardMaterial color={heatCol} emissive={heatCol} emissiveIntensity={hi ? 4 : 2.6} toneMapped={false} />
              </mesh>
              {soft ? (
                <sprite scale={[s * 5, s * 5, 1]}>
                  <spriteMaterial map={soft} color={heatCol} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
                </sprite>
              ) : null}
            </group>
          );
        })}

        {/* split: the highlighted atom's electron leaves toward the copper foil and up */}
        {splitOn
          ? (() => {
              const base = ionPos(HI);
              const orbit = new THREE.Vector3(Math.cos(frame / 4) * 0.32, Math.sin(frame / 4) * 0.32, Math.sin(frame / 5) * 0.12);
              const away = new THREE.Vector3(-2.95, 1.6, 0);
              const e = base.clone().add(orbit.multiplyScalar(1 - split)).lerp(away, split);
              return (
                <group>
                  <mesh position={e}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color="#FFD45A" toneMapped={false} />
                  </mesh>
                  {soft ? (
                    <sprite position={e} scale={[0.5, 0.5, 1]}>
                      <spriteMaterial map={soft} color="#FFC531" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </sprite>
                  ) : null}
                </group>
              );
            })()
          : null}

        {/* block: an electron hits the separator and bounces */}
        {blockT >= 0
          ? (() => {
              const t = blockT;
              const x = interpolate(t, [0, 14, 30], [-1.6, -0.12, -1.0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
              const ring = interpolate(t, [12, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <group>
                  <mesh position={[x, -0.4, 0.3]}>
                    <sphereGeometry args={[0.09, 16, 16]} />
                    <meshBasicMaterial color="#FFD45A" toneMapped={false} />
                  </mesh>
                  {ring > 0 ? (
                    <mesh position={[-0.05, -0.4, 0.3]} rotation={[0, Math.PI / 2, 0]} scale={0.2 + ring * 0.9}>
                      <ringGeometry args={[0.35, 0.45, 48]} />
                      <meshBasicMaterial color="#FF4D4D" toneMapped={false} transparent opacity={1 - ring} side={THREE.DoubleSide} />
                    </mesh>
                  ) : null}
                </group>
              );
            })()
          : null}

        {/* short: electrons pour through the hole */}
        {short > 0
          ? Array.from({length: 24}, (_, k) => {
              const t = ((frame * 2 + k * 9) % 60) / 60;
              const x = -2.0 + t * 4.0;
              const r = 0.18 * Math.sin(Math.PI * t);
              return (
                <mesh key={`s${k}`} position={[x, 0.2 + Math.cos(k) * r, 0.3 + Math.sin(k) * r]}>
                  <sphereGeometry args={[0.065, 12, 12]} />
                  <meshBasicMaterial color={t > 0.45 && t < 0.6 ? '#ffffff' : '#FFB547'} toneMapped={false} transparent opacity={short} />
                </mesh>
              );
            })
          : null}
        {short > 0 || heat > 0 ? <pointLight position={[0, 0.2, 0.6]} intensity={(short * 6 + heat * 30) * (0.85 + 0.15 * Math.sin(frame / 2))} color="#ff6a2a" distance={8} /> : null}

        {/* smoke */}
        {heat > 0.35 && soft
          ? Array.from({length: 26}, (_, k) => {
              const life = 70;
              const tt = since('heat') - 30 - k * 5;
              if (tt < 0) return null;
              const t = (tt % life) / life;
              const s = 0.8 + t * 3;
              return (
                <sprite key={`m${k}`} position={[(rand(k) - 0.5) * 3, 1.0 + t * 3.5, (rand(k + 4) - 0.5) * 1.5]} scale={[s, s, s]}>
                  <spriteMaterial map={soft} color="#4a4d54" transparent opacity={(1 - t) * 0.45} depthWrite={false} />
                </sprite>
              );
            })
          : null}
      </group>
    </Studio>
  );
};

import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Caption, Studio, Tags, canvasTex, clamp01, rand, useCamera, useClock, type Cam, type Tag} from './kit';

/**
 * Quantum3D (2 Nov 2026, the quantum-vs-Bitcoin reel): the `object` format's quantum computer. A generic dilution-refrigerator
 * "chandelier" (gold stages getting smaller towards the cold end, rods, looping coax cables, a heat-exchanger coil, the qubit
 * package with a chip at the bottom) inside a removable silver can, plus an optional padlock prop the machine can attack and a
 * frosted cover that hides the padlock. No brand: it isn't any company's machine.
 *
 * World: the chandelier hangs on the y axis (top plate y ≈ 2.25, chip y ≈ 0.12, facing +z). The padlock sits at props.lockAt
 * (default [1.45, 0.75, 0.6]).
 * Cameras: hero {pos: [2.5, 1.5, 3.3], look: [0, 1.15, 0], fov: 38} · cold end {pos: [0.9, 0.55, 1.5], look: [0, 0.35, 0], fov: 34}
 *   · chip {pos: [0, 0.16, 0.62], look: [0, 0.12, 0.16], fov: 30} · lock {pos: [2.5, 1.15, 2.7], look: [1.1, 0.7, 0.45], fov: 34}
 * actions: open (the can lifts away) | cool (lower stages frost over, blue glow) | ghost (the whole machine turns into a cyan
 *   blueprint hologram: "doesn't exist yet") | solid (back from ghost) | chip (the chip's qubits light up one by one,
 *   props.qubits, default 105) | beam (a beam from the chip to the padlock) | crack (the padlock's shackle pops open, it turns
 *   red, sparks) | cover (a frosted glass cover drops over the padlock; a later beam stops at the cover) | spin (slow turntable)
 *   | label:<n> | hide:<n> | cam
 * props: cam, tags, opened, ghost0, lock (show the padlock), lockAt, covered, qubits, caption, spin0
 */
type V3 = [number, number, number];
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  opened?: boolean;
  ghost0?: boolean;
  lock?: boolean;
  lockAt?: V3;
  covered?: boolean;
  cracked?: boolean;
  qubits?: number;
  caption?: string;
  spin0?: number;
};

const STAGES = [
  {y: 2.25, r: 0.62, t: 0.06},
  {y: 1.82, r: 0.55, t: 0.04},
  {y: 1.4, r: 0.47, t: 0.04},
  {y: 1.02, r: 0.39, t: 0.035},
  {y: 0.68, r: 0.31, t: 0.035},
  {y: 0.38, r: 0.24, t: 0.03},
];

const chipTex = () =>
  canvasTex(512, 512, (g) => {
    g.fillStyle = '#1a1c22';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = '#b48a3c';
    g.lineWidth = 3;
    for (let i = 0; i < 24; i++) {
      const a = 16 + i * 20;
      g.beginPath();
      g.moveTo(a, 0);
      g.lineTo(a, 18);
      g.moveTo(a, 512);
      g.lineTo(a, 494);
      g.moveTo(0, a);
      g.lineTo(18, a);
      g.moveTo(512, a);
      g.lineTo(494, a);
      g.stroke();
    }
    g.strokeStyle = 'rgba(160,170,190,0.25)';
    g.lineWidth = 1.5;
    for (let i = 40; i < 480; i += 22) {
      g.beginPath();
      g.moveTo(40, i);
      g.lineTo(472, i);
      g.stroke();
      g.beginPath();
      g.moveTo(i, 40);
      g.lineTo(i, 472);
      g.stroke();
    }
  });

export const Quantum3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, at, p, since, has} = useClock(beats, acts);

  const openP = props.opened ? 1 : p('open', 30, Easing.inOut(Easing.cubic));
  const coolP = p('cool', 30);
  let ghost = props.ghost0 ? 1 : 0;
  if (has('ghost')) ghost = Math.max(ghost, p('ghost', 20));
  if (has('solid')) ghost = ghost * (1 - p('solid', 20));
  // flicker while switching
  const gs = since('ghost');
  const flick = gs >= 0 && gs < 20 ? (Math.floor(gs / 2) % 2 === 0 ? 1 : 0) : ghost > 0.5 ? 1 : 0;
  const holo = ghost > 0.02 && flick === 1;
  const spin = (props.spin0 ?? 0) + (has('spin') ? Math.max(0, since('spin')) * 0.006 : frame * 0.0025);

  const nQ = props.qubits ?? 105;
  const chipS = since('chip');
  const lit = chipS < 0 ? 0 : Math.min(nQ, Math.floor((chipS / 30) * nQ));

  const lockAt = props.lockAt ?? [1.45, 0.75, 0.6];
  const beamS = since('beam');
  const coverP = props.covered ? 1 : p('cover', 18, Easing.out(Easing.cubic));
  const blocked = coverP > 0.9;
  const crackP = props.cracked ? 1 : has('crack') ? p('crack', 12, Easing.out(Easing.back(2))) : 0;
  const crackS = since('crack');

  const mats = useMemo(
    () => ({
      gold: new THREE.MeshStandardMaterial({color: '#e0a94a', metalness: 1, roughness: 0.22}),
      goldDim: new THREE.MeshStandardMaterial({color: '#b98a3a', metalness: 1, roughness: 0.32}),
      copper: new THREE.MeshStandardMaterial({color: '#c9784a', metalness: 1, roughness: 0.28}),
      steel: new THREE.MeshStandardMaterial({color: '#b9c0c8', metalness: 0.9, roughness: 0.25}),
      can: new THREE.MeshStandardMaterial({color: '#cfd5dc', metalness: 0.92, roughness: 0.2, transparent: true, opacity: 1, side: THREE.DoubleSide}),
      cable: new THREE.MeshStandardMaterial({color: '#d9b36a', metalness: 0.9, roughness: 0.3}),
      cableBlue: new THREE.MeshStandardMaterial({color: '#7a8796', metalness: 0.7, roughness: 0.35}),
      frost: new THREE.MeshStandardMaterial({color: '#9fd4ff', emissive: new THREE.Color('#3f9bff'), emissiveIntensity: 0.8, roughness: 0.6, transparent: true, opacity: 0, depthWrite: false}),
      chipBody: new THREE.MeshStandardMaterial({color: '#2a2d34', metalness: 0.4, roughness: 0.4}),
      qOff: new THREE.MeshStandardMaterial({color: '#3a4250', roughness: 0.5}),
      qOn: new THREE.MeshStandardMaterial({color: '#bff3ff', emissive: new THREE.Color('#3bc9ee'), emissiveIntensity: 1.8, toneMapped: false}),
      holo: new THREE.MeshBasicMaterial({color: '#4fd3ff', wireframe: true, transparent: true, opacity: 0.55, toneMapped: false}),
      beam: new THREE.MeshStandardMaterial({color: '#d9f6ff', emissive: new THREE.Color('#3bc9ee'), emissiveIntensity: 4, toneMapped: false, transparent: true, opacity: 0.9}),
      lockBody: new THREE.MeshStandardMaterial({color: '#c9a24a', metalness: 0.95, roughness: 0.25}),
      lockRed: new THREE.MeshStandardMaterial({color: '#ff5a4e', emissive: new THREE.Color('#ff2a1e'), emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.4}),
      shackle: new THREE.MeshStandardMaterial({color: '#d4dbe3', metalness: 1, roughness: 0.18}),
      keyhole: new THREE.MeshStandardMaterial({color: '#151515', roughness: 0.6}),
      cover: new THREE.MeshPhysicalMaterial({color: '#d8f1ff', roughness: 0.35, metalness: 0, transmission: 0, transparent: true, opacity: 0.55, emissive: new THREE.Color('#5fb8ff'), emissiveIntensity: 0.25}),
      spark: new THREE.MeshStandardMaterial({color: '#ffd0a0', emissive: new THREE.Color('#ff7a3d'), emissiveIntensity: 4, toneMapped: false}),
      pedestal: new THREE.MeshStandardMaterial({color: '#20252e', roughness: 0.55, metalness: 0.3}),
    }),
    [],
  );
  const M = (m: THREE.Material) => (holo ? mats.holo : m);

  // frost / cold glow on the lower stages
  mats.frost.opacity = 0.32 * coolP;

  // cables: looping tubes between stages
  const cables = useMemo(() => {
    const out: {geo: THREE.TubeGeometry; blue: boolean}[] = [];
    for (let s = 0; s < STAGES.length - 1; s++) {
      const a = STAGES[s];
      const b = STAGES[s + 1];
      const n = 7 - Math.floor(s / 2);
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2 + s * 0.4 + rand(s * 9 + k) * 0.3;
        const ra = a.r * (0.55 + rand(k + s) * 0.3);
        const rb = b.r * (0.55 + rand(k + s + 5) * 0.3);
        const p0 = new THREE.Vector3(Math.cos(ang) * ra, a.y - a.t / 2, Math.sin(ang) * ra);
        const p3 = new THREE.Vector3(Math.cos(ang + 0.5) * rb, b.y + b.t / 2, Math.sin(ang + 0.5) * rb);
        const mid = p0.clone().lerp(p3, 0.5);
        const bulge = new THREE.Vector3(Math.cos(ang + 0.25), 0, Math.sin(ang + 0.25)).multiplyScalar(0.08 + rand(k * 3 + s) * 0.06);
        const curve = new THREE.CatmullRomCurve3([p0, p0.clone().lerp(mid, 0.5).add(bulge.clone().multiplyScalar(0.6)), mid.clone().add(bulge), mid.clone().lerp(p3, 0.5).add(bulge.clone().multiplyScalar(0.5)), p3]);
        out.push({geo: new THREE.TubeGeometry(curve, 20, 0.0065, 6, false), blue: k % 3 === 0});
      }
    }
    return out;
  }, []);
  const coilGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const a = t * Math.PI * 2 * 7;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.1, 1.16 - t * 0.26, Math.sin(a) * 0.1));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.008, 6, false);
  }, []);
  const chipT = useMemo(() => chipTex(), []);
  const qPts = useMemo(() => {
    const cand: [number, number][] = [];
    for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) cand.push([i, j]);
    cand.sort((u, v) => u[0] * u[0] + u[1] * u[1] + rand(u[0] * 31 + u[1]) * 0.01 - (v[0] * v[0] + v[1] * v[1] + rand(v[0] * 31 + v[1]) * 0.01));
    return cand.slice(0, nQ).sort((u, v) => u[1] - v[1] || u[0] - v[0]);
  }, [nQ]);
  const boxGeo = useMemo(() => new RoundedBoxGeometry(0.16, 0.14, 0.05, 3, 0.012), []);
  const lockGeo = useMemo(() => new RoundedBoxGeometry(0.36, 0.3, 0.14, 4, 0.04), []);

  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [2.5, 1.5, 3.3], look: [0, 1.15, 0], fov: 38});
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))) * (1 - p(`hide:${i}`, 8)));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} y={1500} /> : null}
    </>
  );

  // beam geometry: chip → lock (or → cover)
  const chipW = new THREE.Vector3(0, 0.12, 0.17);
  const lockC = new THREE.Vector3(...lockAt);
  const target = blocked ? lockC.clone().add(new THREE.Vector3(-0.28, 0.05, 0.05)) : lockC;
  const beamLen = beamS < 0 ? 0 : clamp01(beamS / 10);
  const beamFade = beamS < 0 ? 0 : 1 - clamp01((beamS - (blocked ? 22 : 40)) / 12);
  const beamEnd = chipW.clone().lerp(target, beamLen);
  const showLock = props.lock ?? (has('beam') || has('crack') || has('cover'));

  return (
    <Studio cam={cam} overlay={overlay} bloom={1.05} warm={0.05}>
      <fog attach="fog" args={['#070b12', 6, 16]} />
      <group rotation={[0, spin, 0]}>
        {/* support frame from above */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={i} material={M(mats.steel)} position={[Math.cos(a) * 0.5, 2.75, Math.sin(a) * 0.5]}>
              <cylinderGeometry args={[0.02, 0.02, 1.0, 10]} />
            </mesh>
          );
        })}
        {/* stages */}
        {STAGES.map((s, i) => (
          <group key={i}>
            <mesh material={M(i === 0 ? mats.steel : mats.gold)} position={[0, s.y, 0]}>
              <cylinderGeometry args={[s.r, s.r, s.t, 56]} />
            </mesh>
            {i >= 3 ? (
              <mesh material={mats.frost} position={[0, s.y, 0]}>
                <cylinderGeometry args={[s.r + 0.006, s.r + 0.006, s.t + 0.008, 48]} />
              </mesh>
            ) : null}
            {/* rods down to the next stage */}
            {i < STAGES.length - 1
              ? Array.from({length: 4}).map((_, k) => {
                  const a = (k / 4) * Math.PI * 2 + i * 0.3;
                  const nxt = STAGES[i + 1];
                  const r = Math.min(s.r, nxt.r) * 0.86;
                  const len = s.y - nxt.y;
                  return (
                    <mesh key={k} material={M(mats.goldDim)} position={[Math.cos(a) * r, s.y - len / 2, Math.sin(a) * r]}>
                      <cylinderGeometry args={[0.013, 0.013, len, 10]} />
                    </mesh>
                  );
                })
              : null}
          </group>
        ))}
        {/* central column + heat exchanger coil */}
        <mesh material={M(mats.copper)} position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.7, 20]} />
        </mesh>
        <mesh geometry={coilGeo} material={M(mats.copper)} />
        {cables.map((c, i) => (
          <mesh key={i} geometry={c.geo} material={M(c.blue ? mats.cableBlue : mats.cable)} />
        ))}
        {/* mixing chamber + qubit package */}
        <mesh material={M(mats.gold)} position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.2, 28]} />
        </mesh>
        <mesh geometry={boxGeo} material={M(mats.gold)} position={[0, 0.12, 0.12]} />
      </group>
      {/* the chip faces +z (outside the turntable, so close-ups stay put) */}
      <group position={[0, 0.12, 0.148]}>
        <mesh material={M(mats.chipBody)}>
          <boxGeometry args={[0.1, 0.1, 0.006]} />
        </mesh>
        <mesh position={[0, 0, 0.0035]}>
          <planeGeometry args={[0.096, 0.096]} />
          <meshStandardMaterial map={chipT ?? undefined} roughness={0.5} metalness={0.3} transparent={holo} opacity={holo ? 0.3 : 1} />
        </mesh>
        {qPts.map(([i, j], k) => (
          <mesh key={k} material={k < lit ? mats.qOn : M(mats.qOff)} position={[i * 0.0058, j * 0.0058, 0.0045]}>
            <sphereGeometry args={[0.0019, 8, 6]} />
          </mesh>
        ))}
      </group>
      {chipS >= 0 ? <pointLight position={[0, 0.14, 0.3]} intensity={0.25 * clamp01(lit / nQ)} distance={0.6} color="#3bc9ee" /> : null}
      {/* outer can */}
      {openP < 1 ? (
        <group position={[0, 1.18 + openP * 2.6, 0]} rotation={[0, spin, 0]}>
          <mesh material={M(mats.can)}>
            <cylinderGeometry args={[0.7, 0.7, 2.25, 64, 1, true]} />
          </mesh>
          {[1.06, 0.35, -0.4, -1.08].map((y, i) => (
            <mesh key={i} material={M(mats.steel)} position={[0, y, 0]}>
              <cylinderGeometry args={[0.725, 0.725, i === 0 || i === 3 ? 0.07 : 0.03, 64, 1, true]} />
            </mesh>
          ))}
          <mesh material={M(mats.steel)} position={[0, -1.13, 0]}>
            <cylinderGeometry args={[0.7, 0.62, 0.06, 64]} />
          </mesh>
        </group>
      ) : null}
      {coolP > 0
        ? Array.from({length: 26}).map((_, k) => {
            const t = ((frame * 0.004 + rand(k) ) % 1);
            const a = rand(k + 7) * Math.PI * 2;
            const r = 0.12 + rand(k + 3) * 0.3;
            return (
              <mesh key={k} material={mats.frost} position={[Math.cos(a) * r, 0.2 + t * 0.9, Math.sin(a) * r]} scale={0.6 + rand(k + 1)}>
                <sphereGeometry args={[0.012, 6, 5]} />
              </mesh>
            );
          })
        : null}
      {coolP > 0 ? <pointLight position={[0, 0.5, 0.4]} intensity={0.9 * coolP} distance={1.6} color="#7fc8ff" /> : null}

      {/* padlock on a pedestal */}
      {showLock ? (
        <group position={lockAt}>
          <mesh material={mats.pedestal} position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.26, 0.3, 0.2, 32]} />
          </mesh>
          <group position={[0, 0, 0]} rotation={[0, -0.5, 0]}>
            <mesh geometry={lockGeo} material={crackP > 0.5 ? mats.lockRed : mats.lockBody} />
            <mesh material={mats.keyhole} position={[0, -0.02, 0.072]}>
              <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
            </mesh>
            <mesh material={mats.keyhole} position={[0, -0.06, 0.072]}>
              <boxGeometry args={[0.016, 0.06, 0.01]} />
            </mesh>
            {/* shackle: pops up and swings open on crack */}
            <group position={[0.09, 0.15 + crackP * 0.08, 0]} rotation={[0, crackP * 1.1, 0]}>
              <group position={[-0.09, 0, 0]}>
                <mesh material={mats.shackle} position={[0, 0.11, 0]} rotation={[0, 0, 0]}>
                  <torusGeometry args={[0.09, 0.022, 12, 24, Math.PI]} />
                </mesh>
                <mesh material={mats.shackle} position={[-0.09, 0.05, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.12, 12]} />
                </mesh>
                <mesh material={mats.shackle} position={[0.09, 0.05, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.12, 12]} />
                </mesh>
              </group>
            </group>
          </group>
          {/* frosted cover */}
          {coverP > 0 ? (
            <mesh material={mats.cover} position={[0, 0.02 + (1 - coverP) * 0.9, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.62, 40, 1, false]} />
            </mesh>
          ) : null}
          {crackS >= 0 && crackS < 30
            ? Array.from({length: 14}).map((_, k) => {
                const a = rand(k) * Math.PI * 2;
                const v = 0.4 + rand(k + 4) * 0.6;
                const t = crackS / 30;
                return (
                  <mesh key={k} material={mats.spark} position={[Math.cos(a) * v * t * 0.7, 0.12 + Math.sin(a * 1.7) * 0.2 * t + 0.3 * t - 0.5 * t * t, Math.sin(a) * v * t * 0.5]} scale={1 - t}>
                    <sphereGeometry args={[0.012, 6, 5]} />
                  </mesh>
                );
              })
            : null}
          {crackP > 0.5 ? <pointLight position={[0, 0.2, 0.3]} intensity={1.2} distance={1.4} color="#ff4a3a" /> : null}
        </group>
      ) : null}
      {/* beam */}
      {beamS >= 0 && beamFade > 0 ? (
        <>
          <mesh material={mats.beam} position={chipW.clone().lerp(beamEnd, 0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamEnd.clone().sub(chipW).normalize())} scale={[beamFade, 1, beamFade]}>
            <cylinderGeometry args={[0.012, 0.012, Math.max(0.001, beamEnd.distanceTo(chipW)), 10]} />
          </mesh>
          <pointLight position={beamEnd} intensity={1.5 * beamFade} distance={1} color={blocked ? '#9fdcff' : '#3bc9ee'} />
          {blocked && beamLen >= 1
            ? Array.from({length: 8}).map((_, k) => {
                const t = ((beamS + k * 4) % 16) / 16;
                const a = rand(k) * Math.PI * 2;
                return (
                  <mesh key={k} material={mats.beam} position={[beamEnd.x + Math.cos(a) * 0.12 * t, beamEnd.y + Math.sin(a) * 0.12 * t, beamEnd.z + 0.02]} scale={1 - t}>
                    <sphereGeometry args={[0.01, 6, 5]} />
                  </mesh>
                );
              })
            : null}
        </>
      ) : null}
    </Studio>
  );
};

import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {BlobShadow, Caption, Studio, Tags, canvasTex, clamp01, projectTo, rand, useCamera, useClock, type Cam, type Tag} from './kit';

/**
 * Drives3D — two generic 2.5-inch laptop hard drives (black frame, silver cover, plain white label; no brand) lying in an
 * open wooden desk drawer with everyday clutter (pens, sticky notes, a cable, paper clips). For "which drive was it?" beats.
 *
 * actions (one per beat):
 *   drawer     the drawer slides out (without it the drawer starts open)
 *   glow       drive A (left) glows amber: the one that matters
 *   pick       drive A lifts out and flies off to the upper right (thrown away)
 *   swap       the two drives swap places three times, shell-game style (glow fades: you can't tell them apart)
 *   stick      a hand-written sticker lands on drive A (text: props.sticker)
 *   key        a gold key rises out of drive A (with `solo`: "the key lives on this drive")
 *   label:<n>  show tag n        cam   (no-op beat for cam[])
 * props: solo (one drive on a dark pedestal, no drawer), sticker (default "KEYS · DO NOT BIN"), tags (a tag may set
 * at: "a" | "b" to point at that drive; x/y default to just above it), caption, cam
 */
type DTag = Tag & {at?: 'a' | 'b'; dy?: number};
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: DTag[];
  caption?: string;
  sticker?: string;
  solo?: boolean;
};

const AMBER = '#FFB547';
const DX = 0.45; // drive x offset from the drawer's centre
const DZ = 0.02;
const DRIVE_Y = 0.085;

const useDriveTextures = () =>
  useMemo(() => {
    const brushed = canvasTex(512, 512, (g) => {
      g.fillStyle = '#cfd4da';
      g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y++) {
        const v = 196 + Math.floor(rand(y * 3.1) * 40);
        g.fillStyle = `rgba(${v},${v + 3},${v + 6},0.55)`;
        g.fillRect(0, y, 512, 1);
      }
    });
    const label = canvasTex(540, 600, (g) => {
      g.fillStyle = '#f6f6f3';
      g.fillRect(0, 0, 540, 600);
      g.fillStyle = '#2a2d33';
      g.font = '800 46px Inter, "DejaVu Sans", Arial, sans-serif';
      g.fillText('2.5-inch', 36, 76);
      g.font = '600 30px Inter, "DejaVu Sans", Arial, sans-serif';
      g.fillStyle = '#5d636d';
      g.fillText('SATA hard drive', 36, 120);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#c2c6cc';
        g.fillRect(36, 170 + i * 34, 260 + rand(i + 4) * 200, 12);
      }
      // barcode
      g.fillStyle = '#25282d';
      let x = 36;
      for (let i = 0; i < 46; i++) {
        const w = 2 + Math.floor(rand(i + 40) * 6);
        if (i % 2 === 0) g.fillRect(x, 410, w, 120);
        x += w + 2;
      }
      g.strokeStyle = '#9aa0a8';
      g.lineWidth = 3;
      g.strokeRect(14, 14, 512, 572);
    });
    const pins = canvasTex(512, 64, (g) => {
      g.fillStyle = '#121316';
      g.fillRect(0, 0, 512, 64);
      g.fillStyle = '#d8a93d';
      for (let i = 0; i < 7; i++) g.fillRect(28 + i * 16, 18, 8, 30);
      for (let i = 0; i < 15; i++) g.fillRect(170 + i * 20, 18, 10, 30);
    });
    return {brushed, label, pins};
  }, []);

const useStickerTexture = (text: string) =>
  useMemo(
    () =>
      canvasTex(512, 300, (g) => {
        g.fillStyle = '#FFD84A';
        g.fillRect(0, 0, 512, 300);
        g.fillStyle = 'rgba(0,0,0,0.06)';
        g.fillRect(0, 0, 512, 46);
        g.fillStyle = '#1b1c20';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const parts = text.split('·').map((s) => s.trim());
        const fs = parts.length > 1 ? 82 : 96;
        g.font = `italic 900 ${fs}px Inter, "DejaVu Sans", Arial, sans-serif`;
        parts.forEach((s, i) => g.fillText(s, 256, 300 / 2 + (i - (parts.length - 1) / 2) * (fs * 1.08) + 12));
      }),
    [text],
  );

/** A generic 2.5-inch laptop hard drive, ~0.7 × 1.0 units, label up. Glow = amber halo underneath. */
export const LaptopDrive: React.FC<{glow?: number; sticker?: string; stick?: number}> = ({glow = 0, sticker, stick = 0}) => {
  const tx = useDriveTextures();
  const st = useStickerTexture(sticker ?? 'KEYS · DO NOT BIN');
  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({color: '#1a1c21', metalness: 0.5, roughness: 0.4}),
      cover: new THREE.MeshPhysicalMaterial({color: '#c8cdd3', map: tx.brushed ?? undefined, metalness: 1, roughness: 0.3}),
      screw: new THREE.MeshPhysicalMaterial({color: '#dfe4ea', metalness: 1, roughness: 0.18}),
      label: new THREE.MeshStandardMaterial({map: tx.label ?? undefined, roughness: 0.92, color: '#c9c9c4'}),
      pins: new THREE.MeshStandardMaterial({map: tx.pins ?? undefined, roughness: 0.4, metalness: 0.4}),
      pcb: new THREE.MeshStandardMaterial({color: '#1d5a3b', roughness: 0.6}),
      sticker: new THREE.MeshStandardMaterial({map: st ?? undefined, roughness: 0.8, transparent: true}),
    }),
    [tx, st],
  );
  const body = useMemo(() => new RoundedBoxGeometry(0.7, 0.095, 1.0, 3, 0.014), []);
  const halo = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        const grd = g.createRadialGradient(128, 128, 10, 128, 128, 124);
        grd.addColorStop(0, 'rgba(255,181,71,0.0)');
        grd.addColorStop(0.62, 'rgba(255,181,71,0.7)');
        grd.addColorStop(1, 'rgba(255,181,71,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
      }),
    [],
  );
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({map: halo ?? undefined, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}), [halo]);
  haloMat.opacity = glow;
  mats.sticker.opacity = clamp01(stick * 2);
  return (
    <group>
      <mesh geometry={body} material={mats.body} />
      <mesh material={mats.cover} position={[0, 0.0515, -0.02]}>
        <boxGeometry args={[0.64, 0.008, 0.9]} />
      </mesh>
      <mesh material={mats.label} position={[0, 0.0565, -0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.54, 0.6]} />
      </mesh>
      {[
        [-0.285, -0.43],
        [0.285, -0.43],
        [-0.285, 0.35],
        [0.285, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} material={mats.screw} position={[x, 0.057, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.006, 16]} />
        </mesh>
      ))}
      {/* SATA connector end */}
      <mesh material={mats.body} position={[0.04, -0.012, 0.506]}>
        <boxGeometry args={[0.58, 0.05, 0.02]} />
      </mesh>
      <mesh material={mats.pins} position={[0.04, -0.012, 0.517]}>
        <planeGeometry args={[0.56, 0.045]} />
      </mesh>
      <mesh material={mats.pcb} position={[0, -0.05, 0.2]}>
        <boxGeometry args={[0.6, 0.006, 0.55]} />
      </mesh>
      {stick > 0 ? (
        <mesh material={mats.sticker} position={[0, 0.063, -0.08]} rotation={[-Math.PI / 2, 0, -0.08 - (1 - stick) * 0.35]} scale={1 + (1 - stick) * 0.8}>
          <planeGeometry args={[0.6, 0.35]} />
        </mesh>
      ) : null}
      {glow > 0.01 ? (
        <mesh material={haloMat} position={[0, -0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.25, 1.6]} />
        </mesh>
      ) : null}
    </group>
  );
};

const Key: React.FC<{mat: THREE.Material}> = ({mat}) => (
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

export const useWood = () =>
  useMemo(() => {
    const mk = (base: [number, number, number], seed: number) =>
      canvasTex(1024, 512, (g) => {
        g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
        g.fillRect(0, 0, 1024, 512);
        for (let y = 0; y < 512; y += 2) {
          const w = Math.sin(y * 0.045 + Math.sin(y * 0.011 + seed) * 3) * 0.5 + 0.5;
          const k = 0.82 + w * 0.22 + (rand(y + seed) - 0.5) * 0.06;
          g.fillStyle = `rgba(${Math.floor(base[0] * k)},${Math.floor(base[1] * k)},${Math.floor(base[2] * k)},0.9)`;
          g.fillRect(0, y, 1024, 2);
        }
        for (let i = 0; i < 6; i++) {
          g.strokeStyle = 'rgba(40,22,10,0.18)';
          g.lineWidth = 2;
          g.beginPath();
          const y0 = rand(i + seed) * 512;
          g.moveTo(0, y0);
          for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 10);
          g.stroke();
        }
      });
    return {dark: mk([112, 72, 44], 1), light: mk([176, 132, 92], 7)};
  }, []);

export const Drives3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has} = useClock(beats, acts);
  const solo = !!props.solo;
  const cam = useCamera(props.cam, beats, durationInFrames, solo ? {beat: -1, pos: [0, 1.9, 4.8], look: [0, 0.25, 0], fov: 32} : {beat: -1, pos: [0, 6.0, 2.6], look: [0, 0, 0.15], fov: 34});
  const keyP = p('key', 22, Easing.out(Easing.back(1.4)));
  const keyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#F2C45A', metalness: 1, roughness: 0.2, clearcoat: 0.8, emissive: new THREE.Color('#7a4a00'), emissiveIntensity: 0.6}), []);
  const pedMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#0e1626', metalness: 0.3, roughness: 0.3}), []);
  const wood = useWood();
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({map: wood.dark ?? undefined, roughness: 0.62}), [wood]);
  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({map: wood.light ?? undefined, roughness: 0.75}), [wood]);
  const handleMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#d6dbe1', metalness: 1, roughness: 0.2}), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#0b111c', roughness: 1}), []);

  // drawer slide
  const slide = has('drawer') ? p('drawer', 22, Easing.out(Easing.cubic)) : 1;
  const dz = -1.35 * (1 - slide);

  // drive A / B positions (shell game)
  const swapS = since('swap');
  let xa = -DX;
  let za = DZ;
  let ya = DRIVE_Y;
  let ra = 0;
  if (swapS >= 0) {
    for (let k = 0; k < 3; k++) {
      const t = interpolate(swapS - k * 17, [0, 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
      if (t <= 0) break;
      const from = k % 2 === 0 ? -DX : DX;
      const to = -from;
      xa = from + (to - from) * t;
      za = DZ + (k % 2 === 0 ? 0.32 : -0.32) * Math.sin(Math.PI * t);
      ya = DRIVE_Y + 0.22 * Math.sin(Math.PI * t);
      ra = (k % 2 === 0 ? 1 : -1) * 0.25 * Math.sin(Math.PI * t);
    }
  }
  const xb = -xa;
  const zb = DZ - (za - DZ);
  const yb = ya;
  // pick: A flies away
  const pickP = p('pick', 30, Easing.in(Easing.quad));
  const pickPos: [number, number, number] = [xa + pickP * 2.4, ya + Math.sin(pickP * Math.PI * 0.9) * 1.1 + pickP * 0.9, za + pickP * 0.6 + dz];
  const glowOn = p('glow', 12) * (1 - p('swap', 10)) * (1 - pickP);
  const glow = glowOn * (0.75 + 0.25 * Math.sin(frame / 6));
  const stick = p('stick', 10, Easing.out(Easing.back(1.6)));

  // projected anchors for tags
  const aPos: [number, number, number] = solo ? [0, 0.12, 0] : pickP > 0 ? pickPos : [xa, ya + 0.06, za + dz];
  const bPos: [number, number, number] = [xb, yb + 0.06, zb + dz];
  const tags = (props.tags ?? []).map((t) => {
    if (!t.at) return t;
    const [px, py] = projectTo(cam, t.at === 'a' ? aPos : bPos);
    return {...t, x: t.x ?? px, y: t.y ?? py - (t.dy ?? 150), to: t.to ?? ([px, py] as [number, number])};
  });
  const tagShow = tags.map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={tags as Tag[]} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  // clutter (static, in drawer coords)
  const clutter = useMemo(
    () => ({
      pens: [
        {x: -0.42, z: 0.66, r: 0.08, c: '#2856c8'},
        {x: 0.42, z: -0.64, r: -0.06, c: '#1d1d1f'},
      ],
      notes: [
        {x: -0.7, z: -0.63, r: 0.3},
        {x: 0.74, z: 0.64, r: -0.2},
        {x: 0.68, z: 0.6, r: 0.15},
      ],
      clips: [
        {x: 0.02, z: -0.68, r: 0.6},
        {x: -0.05, z: 0.7, r: -0.4},
        {x: 0.06, z: 0.66, r: 0.9},
      ],
    }),
    [],
  );
  const penMats = useMemo(() => clutter.pens.map((q) => new THREE.MeshStandardMaterial({color: q.c, roughness: 0.3})), [clutter]);
  const noteMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#FFD84A', roughness: 0.85, side: THREE.DoubleSide}), []);
  const cableMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#141519', roughness: 0.5}), []);
  const clipMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#d8dde3', metalness: 1, roughness: 0.25}), []);

  // drawer dims
  const W = 2.0;
  const Dd = 1.6;
  const Hh = 0.36;

  if (solo) {
    const spin = -0.5 + frame * 0.005;
    return (
      <Studio cam={cam} overlay={overlay} bloom={0.9}>
        <fog attach="fog" args={['#0b1220', 6, 16]} />
        <spotLight position={[0.5, 4, 2]} angle={0.5} penumbra={0.8} intensity={10} distance={10} color="#fff4e2" />
        <mesh material={pedMat} position={[0, -0.04, 0]}>
          <cylinderGeometry args={[1.25, 1.32, 0.08, 72]} />
        </mesh>
        <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
          <circleGeometry args={[30, 48]} />
        </mesh>
        <BlobShadow w={1.2} d={1.5} opacity={0.5} position={[0, 0.002, 0]} />
        <group position={[0, 0.1 + 0.02 * Math.sin(frame / 20), 0]} rotation={[0, spin, 0]} scale={1.0}>
          <LaptopDrive glow={Math.max(glow, keyP * (0.6 + 0.25 * Math.sin(frame / 6)))} sticker={props.sticker} stick={stick} />
        </group>
        {keyP > 0 ? (
          <group position={[-0.3, 0.12 + keyP * 0.68, 0.1]} rotation={[0.2, 0.2 + Math.sin(frame / 25) * 0.2, 0.1]} scale={keyP * 0.58}>
            <Key mat={keyMat} />
          </group>
        ) : null}
      </Studio>
    );
  }

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.85} warm={0.35}>
      <fog attach="fog" args={['#0b1220', 7, 18]} />
      <pointLight position={[0.2, 2.6, 1.6]} intensity={3.5} distance={8} color="#fff1dc" />
      {/* floor far below */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <circleGeometry args={[30, 48]} />
      </mesh>
      {/* desk top (the drawer slides out from under it) */}
      <mesh material={woodMat} position={[0, Hh + 0.16, -1.75]}>
        <boxGeometry args={[3.6, 0.1, 2.4]} />
      </mesh>
      {/* desk sides */}
      {[-1.42, 1.42].map((x, i) => (
        <mesh key={i} material={woodMat} position={[x, -0.6, -1.4]}>
          <boxGeometry args={[0.5, 2.3, 1.8]} />
        </mesh>
      ))}
      <group position={[0, 0, dz]}>
        {/* drawer box */}
        <mesh material={innerMat} position={[0, 0, 0]}>
          <boxGeometry args={[W, 0.04, Dd]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={innerMat} position={[(s * W) / 2, Hh / 2, 0]}>
            <boxGeometry args={[0.05, Hh, Dd]} />
          </mesh>
        ))}
        <mesh material={innerMat} position={[0, Hh / 2, -Dd / 2]}>
          <boxGeometry args={[W, Hh, 0.05]} />
        </mesh>
        {/* drawer front + handle */}
        <mesh material={woodMat} position={[0, Hh / 2 - 0.02, Dd / 2 + 0.04]}>
          <boxGeometry args={[W + 0.3, Hh + 0.16, 0.08]} />
        </mesh>
        <mesh material={handleMat} position={[0, Hh / 2 - 0.02, Dd / 2 + 0.13]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.03, 0.5, 6, 16]} />
        </mesh>
        {[-0.27, 0.27].map((x, i) => (
          <mesh key={i} material={handleMat} position={[x, Hh / 2 - 0.02, Dd / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.07, 12]} />
          </mesh>
        ))}
        {/* clutter */}
        {clutter.pens.map((q, i) => (
          <group key={`p${i}`} position={[q.x, 0.05, q.z]} rotation={[0, q.r, Math.PI / 2]}>
            <mesh material={penMats[i]}>
              <cylinderGeometry args={[0.028, 0.028, 0.62, 16]} />
            </mesh>
            <mesh material={penMats[i]} position={[0, 0.36, 0]}>
              <coneGeometry args={[0.028, 0.1, 16]} />
            </mesh>
          </group>
        ))}
        {clutter.notes.map((q, i) => (
          <mesh key={`n${i}`} material={noteMat} position={[q.x, 0.026 + i * 0.002, q.z]} rotation={[-Math.PI / 2, 0, q.r]}>
            <planeGeometry args={[0.3, 0.3]} />
          </mesh>
        ))}
        <group position={[0.32, 0.035, 0.68]} rotation={[-Math.PI / 2, 0, 0.1]} scale={[1.15, 0.5, 1]}>
          <mesh material={cableMat}>
            <torusGeometry args={[0.16, 0.016, 8, 48]} />
          </mesh>
          <mesh material={cableMat} position={[0.04, 0, 0]}>
            <torusGeometry args={[0.13, 0.016, 8, 48]} />
          </mesh>
        </group>
        {clutter.clips.map((q, i) => (
          <mesh key={`c${i}`} material={clipMat} position={[q.x, 0.028, q.z]} rotation={[-Math.PI / 2, 0, q.r]} scale={[1.7, 1, 1]}>
            <torusGeometry args={[0.035, 0.005, 6, 24]} />
          </mesh>
        ))}
        <BlobShadow w={0.95} d={1.25} opacity={0.45} position={[xb, 0.024, zb]} />
        {pickP < 0.02 ? <BlobShadow w={0.95} d={1.25} opacity={0.45} position={[xa, 0.024, za]} /> : null}
        {/* drive B */}
        <group position={[xb, yb, zb]} rotation={[0, -ra, 0]}>
          <LaptopDrive />
        </group>
      </group>
      {/* drive A (world coords, so it can leave the drawer) */}
      {pickP < 0.999 ? (
        <group
          position={pickP > 0 ? pickPos : [xa, ya, za + dz]}
          rotation={[pickP * 2.2, ra + pickP * 1.4, pickP * 0.8]}
          scale={1 - interpolate(pickP, [0.75, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        >
          <LaptopDrive glow={glow} sticker={props.sticker} stick={stick} />
        </group>
      ) : null}
    </Studio>
  );
};

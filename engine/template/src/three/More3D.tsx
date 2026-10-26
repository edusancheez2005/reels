import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {useFrame} from '@react-three/fiber';
import {interpolate, Easing, Img, staticFile} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {Studio, Tags, Caption, useClock, useCamera, rand, type Cam, type Tag} from './kit';

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};

/**
 * Hair3D: a magnified human hair (cuticle scales) next to a separator film drawn to the same scale.
 * props.hair / props.film = diameters in µm (illustrative scale); actions: hair | film | label:<n> | cam
 */
type HairP = {actions?: string[]; cam?: Cam[]; tags?: Tag[]; caption?: string; hair?: number; film?: number};

export const Hair3D: React.FC<SceneProps<HairP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0.6, 0.9, 10.5], look: [0, 0.6, 0], fov: 30});
  const scale = 1.6 / (props.hair ?? 80); // world units per µm
  const hairR = ((props.hair ?? 80) * scale) / 2;
  const filmT = (props.film ?? 20) * scale;
  const cuticle = useMemo(
    () =>
      tex(
        512,
        512,
        (g) => {
          g.fillStyle = '#6b4a2e';
          g.fillRect(0, 0, 512, 512);
          for (let row = 0; row < 10; row++)
            for (let k = 0; k < 6; k++) {
              const y = row * 52 + (k % 2) * 20;
              const x = k * 90 + (rand(row * 7 + k) - 0.5) * 30;
              const grd = g.createLinearGradient(0, y, 0, y + 50);
              grd.addColorStop(0, 'rgba(255,220,180,0.32)');
              grd.addColorStop(1, 'rgba(40,20,10,0.4)');
              g.fillStyle = grd;
              g.beginPath();
              g.moveTo(x - 60, y + 50);
              g.quadraticCurveTo(x, y - 6, x + 60, y + 50);
              g.closePath();
              g.fill();
              g.strokeStyle = 'rgba(255,230,200,0.45)';
              g.lineWidth = 2;
              g.beginPath();
              g.moveTo(x - 60, y + 50);
              g.quadraticCurveTo(x, y - 6, x + 60, y + 50);
              g.stroke();
            }
        },
        [3, 4],
      ),
    [],
  );
  const hairIn = acts.includes('hair') ? p('hair', 24, Easing.out(Easing.cubic)) : 1;
  const filmIn = p('film', 24, Easing.out(Easing.cubic));
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  return (
    <Studio cam={cam} overlay={<><Tags tags={props.tags ?? []} show={tagShow} />{props.caption ? <Caption text={props.caption} /> : null}</>}>
      <group rotation={[0.12, -0.18 + frame * 0.0012, 0]}>
        {/* hair, running left-right */}
        <group position={[(1 - hairIn) * -9, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[hairR, hairR, 10, 64, 1]} />
            <meshPhysicalMaterial map={cuticle ?? undefined} color="#ffffff" roughness={0.45} clearcoat={0.6} clearcoatRoughness={0.3} sheen={1} sheenColor="#ffd8b0" />
          </mesh>
        </group>
        {/* separator film, same scale */}
        <group position={[(1 - filmIn) * 9, -0.45, 0]}>
          <mesh>
            <boxGeometry args={[10, filmT, 1.2]} />
            <meshPhysicalMaterial color="#cfd9e8" transparent opacity={0.75} roughness={0.55} emissive="#4f8cff" emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0, 0, 0.61]}>
            <boxGeometry args={[10, filmT, 0.01]} />
            <meshBasicMaterial color="#9cc2ff" toneMapped={false} />
          </mesh>
        </group>
      </group>
    </Studio>
  );
};

/**
 * Swarm3D: thousands of phones laid out on a plane, the camera rising to show how many there are,
 * a counter that lands on a beat, an optional logo and a label.
 * actions: count | label:<n> | cam      props: value, prefix/suffix, logo, title, sub
 */
type SwarmP = {actions?: string[]; cam?: Cam[]; tags?: Tag[]; caption?: string; value?: number; suffix?: string; logo?: string; title?: string; sub?: string; rows?: number};

export const Swarm3D: React.FC<SceneProps<SwarmP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, at} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 4, 8], look: [0, 0, 0], fov: 34});
  const N = props.rows ?? 36;
  const cAt = at('count');
  const value = props.value ?? 0;
  const t = cAt === null ? 1 : interpolate(frame, [cAt - 30, cAt], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const shown = Math.round(value * t);
  const land = cAt === null ? 0 : interpolate(frame, [cAt - 2, cAt + 6], [1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const head = p('title', 12, Easing.out(Easing.cubic));
  const overlay = (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, fontFamily: theme.font}}>
        {props.logo ? (
          <div style={{opacity: head || (acts.includes('title') ? 0 : 1), transform: `translateY(${(1 - (head || 1)) * 20}px)`, background: 'rgba(255,255,255,0.95)', borderRadius: 22, padding: '18px 34px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile(props.logo)} style={{width: 300}} />
          </div>
        ) : null}
        {props.title ? <div style={{fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textShadow: '0 4px 20px rgba(0,0,0,0.9)', opacity: acts.includes('title') ? head : 1}}>{props.title}</div> : null}
        {cAt !== null && frame >= cAt - 32 ? (
          <div style={{fontSize: 170, fontWeight: 800, color: '#fff', letterSpacing: -6, textShadow: '0 10px 60px rgba(0,0,0,0.9), 0 0 40px rgba(79,140,255,0.5)', transform: `scale(${land})`, fontVariantNumeric: 'tabular-nums'}}>
            {shown.toLocaleString('en-US')}
            <span style={{fontSize: 70, marginLeft: 12}}>{props.suffix ?? ''}</span>
          </div>
        ) : null}
        {props.sub ? <div style={{fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textShadow: '0 4px 20px rgba(0,0,0,0.9)', opacity: cAt === null ? 1 : interpolate(frame, [cAt, cAt + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{props.sub}</div> : null}
      </div>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );
  return (
    <Studio cam={cam} bloom={0.8} overlay={overlay}>
      <fog attach="fog" args={['#070b12', 8, 34]} />
      <Phones N={N} frame={frame} />
    </Studio>
  );
};

const Phones: React.FC<{N: number; frame: number}> = ({N, frame}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const scr = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new RoundedBoxGeometry(0.42, 0.86, 0.05, 3, 0.07), []);
  const items = useMemo(() => {
    const out: {x: number; z: number; r: number; d: number}[] = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) out.push({x: (i - N / 2) * 0.62 + (rand(i * 99 + j) - 0.5) * 0.08, z: (j - N / 2) * 1.0 + (rand(i + j * 77) - 0.5) * 0.1, r: (rand(i * 3 + j) - 0.5) * 0.25, d: Math.hypot(i - N / 2, j - N / 2)});
    return out;
  }, [N]);
  const apply = () => {
    const o = new THREE.Object3D();
    items.forEach((it, k) => {
      const t = interpolate(frame, [it.d * 0.6, it.d * 0.6 + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      o.position.set(it.x, (1 - t) * 3 + 0.03, it.z);
      o.rotation.set(-Math.PI / 2, 0, it.r);
      o.scale.setScalar(t < 0.01 ? 0.0001 : 1);
      o.updateMatrix();
      ref.current?.setMatrixAt(k, o.matrix);
      o.position.y += 0.03;
      o.updateMatrix();
      scr.current?.setMatrixAt(k, o.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    if (scr.current) scr.current.instanceMatrix.needsUpdate = true;
  };
  useFrame(apply);
  useLayoutEffect(apply);
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, undefined, items.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2a2e38" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={scr} args={[undefined, undefined, items.length]} frustumCulled={false}>
        <planeGeometry args={[0.36, 0.78]} />
        <meshBasicMaterial color="#1d3f8f" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

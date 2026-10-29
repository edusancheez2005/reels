import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Environment, Lightformer} from '@react-three/drei';
import {EffectComposer, Bloom, Vignette, Noise, ChromaticAberration} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import {LEAD_FRAMES, revealFrame} from '../lib/anim';
import {usePal} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * Shared kit for the 3D scenes: a full-bleed canvas (under the caption), a studio light rig made of
 * Lightformers (no HDRI download), bloom + vignette + grain, an action/beat clock and 2D overlay labels.
 */

export const CANVAS = {top: 0, w: 1080, h: 1920, shift: 230};

// ---------- beat clock ----------
export type Cam = {beat: number; pos: [number, number, number]; look?: [number, number, number]; fov?: number; dur?: number};

export const useClock = (beats: number[], actions: string[] = []) => {
  const frame = useCurrentFrame();
  const at = (name: string): number | null => {
    const i = actions.indexOf(name);
    return i < 0 ? null : revealFrame(beats, i) - LEAD_FRAMES;
  };
  /** 0→1 progress of an action over `dur` frames (0 if the action isn't listed). */
  const p = (name: string, dur = 18, ease = Easing.inOut(Easing.cubic)) => {
    const f = at(name);
    if (f === null) return 0;
    return interpolate(frame, [f, f + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  };
  /** frames since an action fired (negative before). */
  const since = (name: string) => {
    const f = at(name);
    return f === null ? -1 : frame - f;
  };
  const has = (name: string) => actions.includes(name);
  return {frame, at, p, since, has};
};

/** Camera path through keyframes on beats (beat -1 = opening shot). Smooth, with a tiny handheld drift. */
export const useCamera = (cams: Cam[] | undefined, beats: number[], durationInFrames: number, fallback: Cam) => {
  const frame = useCurrentFrame();
  const list = (cams && cams.length ? cams : [fallback]).map((c) => ({...c, f: c.beat < 0 ? -999 : revealFrame(beats, c.beat) - LEAD_FRAMES}));
  const pos = new THREE.Vector3(...list[0].pos);
  const look = new THREE.Vector3(...(list[0].look ?? [0, 0, 0]));
  let fov = list[0].fov ?? 32;
  for (let k = 1; k < list.length; k++) {
    const c = list[k];
    const t = interpolate(frame, [c.f, c.f + (c.dur ?? 24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    pos.lerp(new THREE.Vector3(...c.pos), t);
    look.lerp(new THREE.Vector3(...(c.look ?? [0, 0, 0])), t);
    fov += ((c.fov ?? fov) - fov) * t;
  }
  // slow push + drift keeps every shot alive
  const push = interpolate(frame, [0, durationInFrames], [1, 0.965]);
  const dir = pos.clone().sub(look).multiplyScalar(push);
  const drift = new THREE.Vector3(Math.sin(frame / 41) * 0.02, Math.cos(frame / 53) * 0.02, 0);
  return {pos: look.clone().add(dir).add(drift), look, fov};
};

const CamRig: React.FC<{pos: THREE.Vector3; look: THREE.Vector3; fov: number}> = ({pos, look, fov}) => {
  // @react-three/fiber: set the default camera every frame from props
  return <PerspCam pos={pos} look={look} fov={fov} />;
};

import {useThree} from '@react-three/fiber';
const PerspCam: React.FC<{pos: THREE.Vector3; look: THREE.Vector3; fov: number}> = ({pos, look, fov}) => {
  const {camera, size} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(pos);
  cam.fov = fov;
  cam.aspect = size.width / size.height;
  // push the subject below the caption band
  cam.setViewOffset(size.width, size.height, 0, -CANVAS.shift, size.width, size.height);
  cam.lookAt(look);
  cam.updateProjectionMatrix();
  return null;
};

// ---------- the stage ----------
export const Studio: React.FC<{
  children: React.ReactNode;
  cam: {pos: THREE.Vector3; look: THREE.Vector3; fov: number};
  bloom?: number;
  warm?: number;
  overlay?: React.ReactNode;
  aberration?: number;
}> = ({children, cam, bloom = 1, warm = 0, overlay, aberration = 0}) => {
  const pal = usePal();
  const {width} = useVideoConfig();
  const dark = pal.name === 'dark';
  const ca = useMemo(() => new THREE.Vector2(0.0006 + aberration, 0.0006 + aberration), [aberration]);
  return (
    <div style={{position: 'absolute', left: 0, top: CANVAS.top, width, height: CANVAS.h}}>
      <ThreeCanvas width={CANVAS.w} height={CANVAS.h} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{fov: cam.fov, near: 0.01, far: 200}}>
        <CamRig {...cam} />
        <color attach="background" args={[pal.bg]} />
        <Backdrop color={dark ? '#1a2440' : '#ffffff'} />
        <ambientLight intensity={dark ? 0.25 : 0.6} />
        <directionalLight position={[3, 6, 5]} intensity={dark ? 1.6 : 1.8} color={warm > 0 ? new THREE.Color('#ffffff').lerp(new THREE.Color('#ff8a3d'), warm) : '#ffffff'} />
        <directionalLight position={[-6, -2, -4]} intensity={1.4} color="#4f8cff" />
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3} position={[0, 6, -4]} scale={[12, 3, 1]} />
          <Lightformer intensity={2.2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 5, 1]} />
          <Lightformer intensity={1.6} color="#7fb0ff" position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[10, 5, 1]} />
          <Lightformer intensity={1} position={[0, -5, 3]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer form="ring" intensity={4} position={[3, 3, 6]} scale={2} />
        </Environment>
        {children}
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.1 * bloom} luminanceThreshold={0.55} luminanceSmoothing={0.2} mipmapBlur radius={0.75} />
          <ChromaticAberration offset={ca} radialModulation={false} modulationOffset={0} blendFunction={BlendFunction.NORMAL} />
          <Noise opacity={dark ? 0.045 : 0.03} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
          <Vignette darkness={dark ? 0.55 : 0.25} offset={0.3} />
        </EffectComposer>
      </ThreeCanvas>
      {overlay}
    </div>
  );
};

/** A huge soft radial glow far behind the subject: studio depth instead of a flat void. */
const Backdrop: React.FC<{color: string}> = ({color}) => {
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[0, 0, -14]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial map={tex ?? undefined} color={color} transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
};

// ---------- 2D overlay labels (canvas pixel coords, 1080 × CANVAS.h) ----------
export type Tag = {text: string; x: number; y: number; to?: [number, number]; tone?: 'accent' | 'alert' | 'good' | 'warm' | 'muted'; size?: number; mono?: boolean};

export const Tags: React.FC<{tags: Tag[]; show: number[]}> = ({tags, show}) => {
  const pal = usePal();
  return (
    <svg width={1080} height={CANVAS.h} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {tags.map((t, i) => {
        const o = show[i] ?? 0;
        if (o <= 0) return null;
        const col = t.tone === 'alert' ? '#FF5A4E' : t.tone === 'good' ? '#3DDC84' : t.tone === 'warm' ? '#FFB547' : t.tone === 'muted' ? pal.muted : '#ffffff';
        const fs = t.size ?? 34;
        const lineLen = o;
        return (
          <g key={i} opacity={Math.min(1, o * 1.6)}>
            {t.to ? (
              <>
                <line x1={t.x} y1={t.y + 14} x2={t.x + (t.to[0] - t.x) * lineLen} y2={t.y + 14 + (t.to[1] - t.y - 14) * lineLen} stroke={col} strokeWidth={2.5} opacity={0.85} />
                <circle cx={t.to[0]} cy={t.to[1]} r={7 * o} fill={col} />
              </>
            ) : null}
            <text
              x={t.x}
              y={t.y}
              textAnchor="middle"
              fontFamily={t.mono ? theme.mono : theme.font}
              fontWeight={800}
              fontSize={fs}
              letterSpacing={t.mono ? 1 : 4}
              fill={col}
              style={{textTransform: 'uppercase', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.85))'}}
              transform={`translate(0 ${(1 - o) * 14})`}
            >
              {t.text}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const Caption: React.FC<{text: string; y?: number}> = ({text, y = 1470}) => (
  <div style={{position: 'absolute', left: 60, top: y, fontFamily: theme.font, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.72)', textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>{text}</div>
);

// ---------- shared materials / textures ----------
export const glowMat = (color: string, intensity = 3) => new THREE.MeshStandardMaterial({color, emissive: new THREE.Color(color), emissiveIntensity: intensity, toneMapped: false});

/** Soft round sprite texture for smoke/sparks (generated, no files). */
export const useSoftTexture = () =>
  useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

export const rand = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const ease = Easing.inOut(Easing.cubic);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Canvas pixel position (1080 × CANVAS.h) of a world point, for the camera returned by useCamera. */
export const projectTo = (cam: {pos: THREE.Vector3; look: THREE.Vector3; fov: number}, v: [number, number, number]): [number, number] => {
  const c = new THREE.PerspectiveCamera(cam.fov, CANVAS.w / CANVAS.h, 0.01, 200);
  c.position.copy(cam.pos);
  c.lookAt(cam.look);
  c.setViewOffset(CANVAS.w, CANVAS.h, 0, -CANVAS.shift, CANVAS.w, CANVAS.h);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const p = new THREE.Vector3(...v).project(c);
  return [((p.x + 1) / 2) * CANVAS.w, ((1 - p.y) / 2) * CANVAS.h];
};

/** A texture drawn on a 2D canvas (null during SSR). */
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Soft blob shadow under a prop or character (a radial gradient on the floor). */
export const BlobShadow: React.FC<{w: number; d: number; y?: number; opacity?: number; position?: [number, number, number]}> = ({w, d, opacity = 0.55, position = [0, 0, 0]}) => {
  const t = useMemo(
    () =>
      canvasTex(128, 128, (g) => {
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, 'rgba(0,0,0,1)');
        grd.addColorStop(0.55, 'rgba(0,0,0,0.45)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
      }, false),
    [],
  );
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={t ?? undefined} transparent opacity={opacity} depthWrite={false} color="#000000" />
    </mesh>
  );
};

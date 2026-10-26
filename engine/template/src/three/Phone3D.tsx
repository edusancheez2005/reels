import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {interpolate, Easing} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {Studio, Tags, Caption, useClock, useCamera, useSoftTexture, rand, clamp01, type Cam, type Tag} from './kit';

/**
 * A realistic smartphone built in layers (hollow titanium frame, front glass + lit lock screen, mid-frame,
 * battery pouch, logic board, camera modules, back glass with camera bump).
 * Actions (fire on beats):
 *   spin     rotate from rotY to spinTo
 *   open     back glass lifts off and slides away, revealing the inside
 *   explode  layers separate along depth (front glass, screen, frame, battery, board, back)
 *   wall     the battery's separator seam glows
 *   path     electrons run from the battery tab through the board
 *   screen   screen wakes; battery % animates pct → pctTo
 *   cable    a USB-C cable plugs in
 *   heat     the pouch swells and glows; smoke + embers follow
 *   label:<n> show tags[n]       cam   (a beat for camera moves)
 */
type P = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  rotY?: number;
  rotX?: number;
  spinTo?: number;
  opened?: boolean;
  exploded?: boolean;
  screenOn?: boolean;
  wall?: number;
  pct?: number;
  pctTo?: number;
  back?: string;
  heat0?: number;
};

const W = 1.5;
const H = 3.1;
const D = 0.16;
const R = 0.22;

const rrect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

const useGeoms = () =>
  useMemo(() => {
    const ring = rrect(W, H, R);
    const hole = rrect(W - 0.1, H - 0.1, R - 0.05);
    ring.holes.push(new THREE.Path(hole.getPoints(48)));
    const frame = new THREE.ExtrudeGeometry(ring, {depth: D - 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 6, curveSegments: 48});
    frame.translate(0, 0, -(D - 0.02) / 2);
    const plate = new THREE.ExtrudeGeometry(rrect(W - 0.03, H - 0.03, R - 0.015), {depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 3, curveSegments: 48});
    plate.translate(0, 0, -0.007);
    const mid = new THREE.ExtrudeGeometry(rrect(W - 0.1, H - 0.1, R - 0.05), {depth: 0.02, bevelEnabled: false, curveSegments: 32});
    mid.translate(0, 0, -0.01);
    return {frame, plate, mid};
  }, []);

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, mirror = false) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (mirror) {
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
  }
  return t;
};

const screenTexture = (pct: number, on: number) =>
  canvasTex(600, 1240, (g) => {
    const bg = g.createLinearGradient(0, 0, 600, 1240);
    bg.addColorStop(0, '#071433');
    bg.addColorStop(0.55, '#16408f');
    bg.addColorStop(1, '#45207a');
    g.fillStyle = bg;
    g.fillRect(0, 0, 600, 1240);
    for (let i = 0; i < 7; i++) {
      const cx = 60 + rand(i) * 480;
      const cy = 300 + rand(i + 9) * 900;
      const r = g.createRadialGradient(cx, cy, 0, cx, cy, 260);
      r.addColorStop(0, `rgba(${110 + i * 18},${150 + i * 8},255,0.42)`);
      r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 600, 1240);
    }
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.textAlign = 'center';
    g.font = '600 32px Inter, Helvetica, Arial';
    g.fillText('Monday 26 October', 300, 200);
    g.font = '700 168px Inter, Helvetica, Arial';
    g.fillText('9:41', 300, 365);
    // battery widget
    g.fillStyle = 'rgba(255,255,255,0.13)';
    g.beginPath();
    g.roundRect(140, 860, 320, 170, 44);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.92)';
    g.lineWidth = 6;
    g.beginPath();
    g.roundRect(175, 900, 170, 86, 18);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.fillRect(349, 928, 10, 30);
    g.fillStyle = pct > 0.2 ? '#3DDC84' : '#FF5A4E';
    g.beginPath();
    g.roundRect(184, 909, Math.max(8, 152 * pct), 68, 11);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '700 46px Inter, Helvetica, Arial';
    g.fillText(`${Math.round(pct * 100)}%`, 405, 960);
    if (on < 1) {
      g.fillStyle = `rgba(0,0,0,${0.94 * (1 - on)})`;
      g.fillRect(0, 0, 600, 1240);
    }
  });

const foilTexture = () =>
  canvasTex(512, 640, (g) => {
    const bg = g.createLinearGradient(0, 0, 512, 640);
    bg.addColorStop(0, '#d9dce2');
    bg.addColorStop(0.5, '#b9bec7');
    bg.addColorStop(1, '#d0d3da');
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 640);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${rand(i) > 0.5 ? '255,255,255' : '60,64,72'},${0.05 * rand(i + 7)})`;
      g.fillRect(rand(i + 1) * 512, rand(i + 2) * 640, 1 + rand(i + 3) * 30, 1);
    }
    // black label sticker
    g.fillStyle = '#111317';
    g.beginPath();
    g.roundRect(46, 150, 420, 300, 14);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = '700 34px Inter, Helvetica, Arial';
    g.fillText('Li-ion Polymer Battery', 76, 214);
    g.font = '500 24px Inter, Helvetica, Arial';
    g.fillStyle = 'rgba(255,255,255,0.55)';
    ['Rechargeable cell', 'Do not puncture or crush', 'Do not expose to heat'].forEach((t, i) => g.fillText(t, 76, 268 + i * 40));
    g.strokeStyle = 'rgba(255,255,255,0.3)';
    g.strokeRect(76, 390, 120, 36);
  }, true);

const pcbTexture = () =>
  canvasTex(512, 380, (g) => {
    g.fillStyle = '#0b1f18';
    g.fillRect(0, 0, 512, 380);
    g.strokeStyle = 'rgba(214,178,80,0.6)';
    g.lineWidth = 2;
    for (let i = 0; i < 90; i++) {
      g.beginPath();
      const x = rand(i) * 512;
      const y = rand(i + 50) * 380;
      g.moveTo(x, y);
      g.lineTo(x + (rand(i + 3) - 0.5) * 180, y);
      g.lineTo(x + (rand(i + 3) - 0.5) * 180, y + (rand(i + 7) - 0.5) * 140);
      g.stroke();
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = rand(i + 99) > 0.5 ? '#c9a54e' : '#3a3d44';
      g.fillRect(rand(i + 11) * 500, rand(i + 13) * 370, 6 + rand(i) * 10, 4 + rand(i + 5) * 8);
    }
  });

// electron path on the inside (viewed from the back): battery tab → board → processor
const PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.32, 0.47, 0),
  new THREE.Vector3(0.42, 0.72, 0),
  new THREE.Vector3(0.2, 0.95, 0),
  new THREE.Vector3(-0.15, 1.05, 0),
  new THREE.Vector3(-0.38, 0.85, 0),
  new THREE.Vector3(-0.3, 0.55, 0),
  new THREE.Vector3(-0.3, 0.47, 0),
]);

export const Phone3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, since, has, at} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 0, 10.2], fov: 30});
  const soft = useSoftTexture();
  const g = useGeoms();

  const open = props.opened ? 1 : p('open', 26, Easing.inOut(Easing.cubic));
  const explode = props.exploded ? 1 : p('explode', 30, Easing.inOut(Easing.cubic));
  const wall = clamp01((props.wall ?? 0) + p('wall', 14));
  const heat = clamp01((props.heat0 ?? 0) + p('heat', 40, Easing.in(Easing.quad)));
  const smokeT = has('heat') ? Math.max(0, since('heat') - 12 + (props.heat0 ?? 0) * 60) : 0;
  const screenOn = clamp01((props.screenOn ? 1 : 0) + p('screen', 12));
  const sAt = at('screen') ?? 0;
  const pct = props.pctTo !== undefined ? interpolate(frame, [sAt, sAt + 36], [props.pct ?? 0.4, props.pctTo], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : props.pct ?? 0.82;
  const pctKey = Math.round(pct * 100);
  const onKey = Math.round(screenOn * 10);
  const screenTex = useMemo(() => screenTexture(pctKey / 100, onKey / 10), [pctKey, onKey]);
  const foil = useMemo(() => foilTexture(), []);
  const pcb = useMemo(() => pcbTexture(), []);
  const cable = p('cable', 22, Easing.out(Easing.cubic));
  const pathOn = p('path', 16);

  const spin = props.spinTo !== undefined ? interpolate(p('spin', 40), [0, 1], [props.rotY ?? 0, props.spinTo]) : props.rotY ?? -0.35;
  const idle = Math.sin(frame / 38) * 0.05;
  const shake = heat > 0.55 ? (rand(frame) - 0.5) * 0.025 * heat : 0;
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));

  const blue = new THREE.Color('#4f8cff');
  const hot = new THREE.Color('#ff5a1f');
  const seam = blue.clone().lerp(hot, clamp01(heat * 1.4));
  const ex = explode * 0.55; // layer spacing
  const backCol = props.back ?? '#2a3346';

  return (
    <Studio cam={cam} bloom={1 + heat * 0.9} warm={heat} overlay={<><Tags tags={props.tags ?? []} show={tagShow} />{props.caption ? <Caption text={props.caption} /> : null}</>}>
      <group rotation={[(props.rotX ?? 0.1) + idle * 0.4, spin + idle, 0.03]} position={[shake, idle * 0.25, 0]}>
        {/* front glass + screen */}
        <group position={[0, 0, D / 2 - 0.004 + ex * 2]}>
          <mesh geometry={g.plate}>
            <meshPhysicalMaterial color="#030407" metalness={0.1} roughness={0.05} clearcoat={1} clearcoatRoughness={0.02} />
          </mesh>
          <mesh position={[0, 0, 0.0125]}>
            <planeGeometry args={[W - 0.11, H - 0.11]} />
            <meshBasicMaterial map={screenTex ?? undefined} toneMapped={false} />
          </mesh>
          <RoundedBox args={[0.36, 0.1, 0.004]} radius={0.05} position={[0, H / 2 - 0.2, 0.015]}>
            <meshBasicMaterial color="#000" />
          </RoundedBox>
          {/* glass reflection sheen */}
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[W - 0.06, H - 0.06]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.06} roughness={0} metalness={1} />
          </mesh>
        </group>

        {/* titanium frame */}
        <mesh geometry={g.frame} position={[0, 0, ex * 0.6]}>
          <meshPhysicalMaterial color="#a6a39d" metalness={1} roughness={0.32} clearcoat={0.3} />
        </mesh>
        {/* buttons */}
        {[
          [-1, 0.78, 0.13],
          [-1, 0.48, 0.26],
          [-1, 0.18, 0.26],
          [1, 0.55, 0.42],
        ].map(([side, y, h], i) => (
          <RoundedBox key={i} args={[0.035, h, 0.075]} radius={0.015} position={[side * (W / 2 + 0.02), y, ex * 0.6]}>
            <meshStandardMaterial color="#9d9a94" metalness={1} roughness={0.3} />
          </RoundedBox>
        ))}

        {/* mid-frame + internals (face the back, -z) */}
        <group position={[0, 0, -ex * 0.6]}>
          <mesh geometry={g.mid} position={[0, 0, 0.03]}>
            <meshStandardMaterial color="#2b2e34" metalness={0.8} roughness={0.45} />
          </mesh>
          {/* logic board */}
          <group position={[0, 0.9, -ex * 0.9]}>
            <mesh>
              <boxGeometry args={[W - 0.22, 0.85, 0.028]} />
              <meshStandardMaterial map={pcb ?? undefined} roughness={0.55} />
            </mesh>
            {[
              [-0.12, 0.05, 0.36, 0.3, '#24272d'],
              [0.33, 0.18, 0.2, 0.2, '#181a1e'],
              [0.32, -0.2, 0.22, 0.12, '#181a1e'],
              [-0.42, -0.25, 0.18, 0.12, '#22252b'],
            ].map(([x, y, w, h, c], i) => (
              <RoundedBox key={i} args={[w as number, h as number, 0.04]} radius={0.008} position={[x as number, y as number, -0.03]}>
                <meshStandardMaterial color={c as string} metalness={0.6} roughness={0.35} />
              </RoundedBox>
            ))}
            {/* shield can over the processor */}
            <RoundedBox args={[0.42, 0.36, 0.03]} radius={0.01} position={[-0.12, 0.05, -0.055]}>
              <meshStandardMaterial color="#7d8189" metalness={1} roughness={0.35} />
            </RoundedBox>
          </group>
          {/* camera modules */}
          {[
            [-0.42, 1.12],
            [-0.42, 0.78],
            [-0.12, 0.95],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, -0.06 - ex * 0.9]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 40]} />
              <meshStandardMaterial color="#1b1d22" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* battery pouch */}
          <group position={[0, -0.42, -0.03 - ex * 1.8]} scale={[1 + heat * 0.03, 1 + heat * 0.03, 1 + heat * 1.6]}>
            <RoundedBox args={[W - 0.24, 1.78, 0.07]} radius={0.03} smoothness={5}>
              <meshPhysicalMaterial
                map={foil ?? undefined}
                color={new THREE.Color('#ffffff').lerp(new THREE.Color('#3a2418'), heat * 0.85)}
                metalness={0.75}
                roughness={0.38}
                clearcoat={0.4}
                emissive={hot}
                emissiveIntensity={heat * heat * 0.9}
              />
            </RoundedBox>
            {/* glowing seam = the separator's edge, all round the pouch */}
            {[
              [0, 0.895, W - 0.24, 0.012],
              [0, -0.895, W - 0.24, 0.012],
              [-(W - 0.24) / 2, 0, 0.012, 1.78],
              [(W - 0.24) / 2, 0, 0.012, 1.78],
            ].map(([x, y, w, h], i) => (
              <mesh key={i} position={[x, y, 0]}>
                <boxGeometry args={[w + 0.004, h + 0.004, 0.012]} />
                <meshBasicMaterial color={seam} toneMapped={false} transparent opacity={0.15 + 0.85 * clamp01(wall + heat)} />
              </mesh>
            ))}
            {/* tabs */}
            {[-0.32, 0.32].map((x, i) => (
              <mesh key={i} position={[x, 0.95, 0]}>
                <boxGeometry args={[0.18, 0.12, 0.012]} />
                <meshStandardMaterial color={i ? '#d0d3d9' : '#c87533'} metalness={1} roughness={0.25} />
              </mesh>
            ))}
          </group>
          {/* speaker + taptic */}
          <RoundedBox args={[0.5, 0.16, 0.05]} radius={0.02} position={[0.25, -1.43, -0.03 - ex * 0.9]}>
            <meshStandardMaterial color="#202227" metalness={0.5} roughness={0.5} />
          </RoundedBox>
          {/* electron path */}
          {pathOn > 0 ? (
            <group position={[0, 0, -0.09 - ex * 0.9]} rotation={[0, Math.PI, 0]}>
              <mesh>
                <tubeGeometry args={[PATH, 90, 0.013, 8, false]} />
                <meshBasicMaterial color="#FFC531" toneMapped={false} transparent opacity={0.55 * pathOn} />
              </mesh>
              {Array.from({length: 16}, (_, k) => {
                const t = (((k / 16 + (frame - (at('path') ?? 0)) / 50) % 1) + 1) % 1;
                const v = PATH.getPointAt(t);
                return (
                  <mesh key={k} position={v}>
                    <sphereGeometry args={[0.036, 16, 16]} />
                    <meshBasicMaterial color="#FFE08A" toneMapped={false} transparent opacity={pathOn} />
                  </mesh>
                );
              })}
            </group>
          ) : null}
        </group>

        {/* back glass + camera bump: lifts off on "open" */}
        <group position={[0, open * 1.6, -D / 2 + 0.004 - open * 2.6 - ex * 2.4]} rotation={[open * 0.5, 0, 0]} visible={open < 0.98}>
          <mesh geometry={g.plate}>
            <meshPhysicalMaterial color={backCol} metalness={0.3} roughness={0.32} clearcoat={1} clearcoatRoughness={0.25} transparent opacity={1 - open * 0.85} />
          </mesh>
          <group position={[-0.34, H / 2 - 0.46, -0.028]}>
            <RoundedBox args={[0.68, 0.68, 0.04]} radius={0.14}>
              <meshPhysicalMaterial color={backCol} metalness={0.4} roughness={0.12} clearcoat={1} transparent opacity={1 - open * 0.85} />
            </RoundedBox>
            {[
              [-0.15, 0.15],
              [-0.15, -0.15],
              [0.16, 0],
            ].map(([x, y], i) => (
              <group key={i} position={[x, y, -0.03]} rotation={[0, Math.PI, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.112, 0.112, 0.04, 48]} />
                  <meshStandardMaterial color="#b3b0aa" metalness={1} roughness={0.2} transparent opacity={1 - open * 0.85} />
                </mesh>
                <mesh position={[0, 0, 0.021]}>
                  <circleGeometry args={[0.088, 48]} />
                  <meshPhysicalMaterial color="#05070d" metalness={0.2} roughness={0.02} clearcoat={1} iridescence={1} iridescenceIOR={1.7} transparent opacity={1 - open * 0.85} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* charging cable */}
        {cable > 0 ? (
          <group position={[0, -H / 2 - 0.02 - (1 - cable) * 1.5, 0]}>
            <RoundedBox args={[0.26, 0.44, 0.12]} radius={0.05} position={[0, -0.24, 0]}>
              <meshPhysicalMaterial color="#f4f4f4" roughness={0.35} clearcoat={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.15, 0.12, 0.045]} radius={0.015} position={[0, 0.02, 0]}>
              <meshStandardMaterial color="#d0d3d9" metalness={1} roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, -1.7, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 2.6, 24]} />
              <meshPhysicalMaterial color="#f4f4f4" roughness={0.4} clearcoat={0.4} />
            </mesh>
          </group>
        ) : null}
      </group>

      {/* smoke + embers */}
      {smokeT > 0 && soft
        ? Array.from({length: 30}, (_, k) => {
            const life = 80;
            const tt = smokeT - k * 6;
            if (tt < 0) return null;
            const t = (tt % life) / life;
            const x = (rand(k) - 0.5) * 1.2 + Math.sin(t * 5 + k) * 0.3 * t;
            const y = -0.4 + t * 3.8;
            const s = 0.5 + t * 2.2;
            return (
              <sprite key={k} position={[x, y, -0.6 + rand(k + 3) * 0.5]} scale={[s, s, s]}>
                <spriteMaterial map={soft} color={new THREE.Color('#6b6f78').lerp(new THREE.Color('#2a2c30'), t)} transparent opacity={(1 - t) * 0.5 * clamp01(smokeT / 25)} depthWrite={false} />
              </sprite>
            );
          })
        : null}
      {heat > 0.3 && soft
        ? Array.from({length: 22}, (_, k) => {
            const t = ((frame * 1.4 + k * 11) % 40) / 40;
            return (
              <sprite key={`e${k}`} position={[(rand(k + 20) - 0.5) * 1.2, -1.2 + t * 2.6, -0.4]} scale={[0.07, 0.07, 0.07]}>
                <spriteMaterial map={soft} color="#ffb547" transparent opacity={(1 - t) * heat} blending={THREE.AdditiveBlending} depthWrite={false} />
              </sprite>
            );
          })
        : null}
      {heat > 0 ? <pointLight position={[0, -0.4, -0.9]} intensity={heat * 30} color="#ff5a1f" distance={6} /> : null}
    </Studio>
  );
};

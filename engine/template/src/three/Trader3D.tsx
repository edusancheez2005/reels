import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {theme} from '../lib/theme';
import {BlobShadow, Caption, Studio, Tags, canvasTex, clamp01, rand, useCamera, useClock, type Cam, type Tag} from './kit';

/**
 * Trader3D (2 Nov 2026, the TRUMP-sniper reel): a grounded, adult-proportioned person (same build as Walk3D's) seated at a
 * desk at night with three monitors, a keyboard, a mouse, a desk lamp and a window onto a city. The screens' content comes
 * from props.screens, so any trader / analyst / hacker / developer-at-a-desk story can reuse it.
 *
 * World: he sits at the origin facing +z (the monitors); his left is +x. Floor y = 0, desk top y ≈ 0.745, screens ≈ y 1.12.
 * Cameras (absolute, cam[]):
 *   over the shoulder  {pos: [-0.8, 1.5, -1.25], look: [0.05, 1.1, 0.95], fov: 34}
 *   side, face lit     {pos: [1.95, 1.28, 0.6], look: [0, 1.12, 0.12], fov: 30}
 *   screens, pushed in {pos: [-0.5, 1.4, -0.75], look: [0.1, 1.12, 0.99], fov: 30}  (portrait can't fit a whole monitor up close)
 *   wide               {pos: [2.6, 2.0, -2.2], look: [0, 0.9, 0.4], fov: 34}
 * actions (one per beat):
 *   type | mouse | click | lean | idle | look        poses (typing / hand on the mouse / click / lean back, hands behind head /
 *                                                    rest / turn the head towards +x, the side camera)
 *   screen:<state>   all three monitors switch to props.screens[state] (with a white flash)
 *   count            the counter overlay (props.counter) counts from → to
 *   card             name card (props.card)      label:<n>  show tag n      hide:<n>  hide tag n      cam  (no-op beat)
 * props: screens {[state]: {head, big, sub[], tone: accent|good|alert|warm|muted, chart: flat|up|spike|down, feed[]}},
 *   screen (starting state), cam, tags, card {name, role, note, y}, counter {from, to, prefix, suffix, x, y, size, label},
 *   colours {top, legs, hair, skin}, caption (small text at the bottom, e.g. "3D recreation"), lamp (warm lamp on, default true)
 */
type V3 = [number, number, number];
type Tone = 'accent' | 'good' | 'alert' | 'warm' | 'muted';
type ScreenState = {head?: string; big?: string; sub?: string[]; tone?: Tone; chart?: 'flat' | 'up' | 'spike' | 'down'; feed?: string[]};
type P = {
  actions?: string[];
  cam?: Cam[];
  screens?: Record<string, ScreenState>;
  screen?: string;
  tags?: Tag[];
  card?: {name: string; role?: string; note?: string; y?: number};
  counter?: {from?: number; to: number; prefix?: string; suffix?: string; x?: number; y?: number; size?: number; label?: string};
  colours?: {top?: string; legs?: string; hair?: string; skin?: string};
  caption?: string;
  lamp?: boolean;
};

const TONE: Record<Tone, string> = {accent: '#3bc9ee', good: '#3ddc84', alert: '#ff5a4e', warm: '#ffb547', muted: '#8595a8'};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const UP = new THREE.Vector3(0, 1, 0);

const Bone: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r: number; mat: THREE.Material}> = ({a, b, r, mat}) => {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  return (
    <mesh material={mat} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q}>
      <capsuleGeometry args={[r, Math.max(0.01, len), 5, 12]} />
    </mesh>
  );
};

const solveArm = (S: THREE.Vector3, H: THREE.Vector3, pole: THREE.Vector3, L1 = 0.29, L2 = 0.27) => {
  const d = H.clone().sub(S);
  const dist = THREE.MathUtils.clamp(d.length(), 0.05, L1 + L2 - 0.002);
  const dir = d.normalize();
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  const pv = pole.clone().sub(S);
  pv.sub(dir.clone().multiplyScalar(pv.dot(dir)));
  if (pv.lengthSq() < 1e-6) pv.set(0, 0, -1);
  pv.normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(L1 * Math.cos(a))).add(pv.multiplyScalar(L1 * Math.sin(a)));
  return {E, H: S.clone().add(dir.clone().multiplyScalar(dist))};
};

// ---------- screen textures ----------
const FONT = '"DejaVu Sans", Arial, sans-serif';
const MONO = '"DejaVu Sans Mono", monospace';

const centreTex = (s: ScreenState) =>
  canvasTex(1024, 576, (g) => {
    const col = TONE[s.tone ?? 'accent'];
    g.fillStyle = '#05080e';
    g.fillRect(0, 0, 1024, 576);
    // top bar
    g.fillStyle = '#0e1622';
    g.fillRect(0, 0, 1024, 54);
    g.fillStyle = col;
    g.fillRect(0, 54, 1024, 4);
    g.font = `700 26px ${MONO}`;
    g.fillStyle = '#7f8fa3';
    g.fillText('● ● ●   terminal', 22, 36);
    // head
    g.fillStyle = col;
    g.font = `800 40px ${FONT}`;
    g.fillText((s.head ?? '').toUpperCase(), 48, 136);
    // big
    g.fillStyle = '#ffffff';
    const big = s.big ?? '';
    let fs = 112;
    g.font = `900 ${fs}px ${FONT}`;
    while (g.measureText(big).width > 760 && fs > 50) {
      fs -= 4;
      g.font = `900 ${fs}px ${FONT}`;
    }
    g.fillText(big, 48, 136 + 40 + fs * 0.92);
    // sub lines
    g.font = `600 36px ${MONO}`;
    (s.sub ?? []).forEach((line, i) => {
      g.fillStyle = i === 0 ? '#d7e2ee' : '#93a3b6';
      g.fillText(line, 50, 136 + 40 + fs + 70 + i * 52);
    });
    // scanlines
    g.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < 576; y += 4) g.fillRect(0, y, 1024, 1);
  });

const chartTex = (s: ScreenState, seed: number) =>
  canvasTex(1024, 576, (g) => {
    const col = TONE[s.tone ?? 'accent'];
    g.fillStyle = '#05080e';
    g.fillRect(0, 0, 1024, 576);
    g.strokeStyle = 'rgba(130,150,175,0.16)';
    g.lineWidth = 2;
    for (let x = 0; x < 1024; x += 85) {
      g.beginPath();
      g.moveTo(x, 40);
      g.lineTo(x, 560);
      g.stroke();
    }
    for (let y = 60; y < 560; y += 70) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1024, y);
      g.stroke();
    }
    const kind = s.chart ?? 'flat';
    const N = 34;
    let v = 0.5;
    const vals: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const noise = (rand(seed * 17 + i) - 0.5) * 0.06;
      if (kind === 'flat') v = 0.62 + noise * 0.6;
      else if (kind === 'up') v = 0.85 - 0.62 * Math.pow(t, 1.6) + noise;
      else if (kind === 'spike') v = t < 0.55 ? 0.86 + noise * 0.3 : 0.86 - 0.72 * Math.min(1, (t - 0.55) / 0.2) + noise;
      else v = 0.2 + 0.62 * Math.pow(t, 0.8) + noise;
      vals.push(Math.max(0.08, Math.min(0.92, v)));
    }
    const cw = 1024 / N;
    vals.forEach((val, i) => {
      const prev = i ? vals[i - 1] : val;
      const up = val <= prev;
      const c = up ? '#3ddc84' : '#ff5a4e';
      const y0 = 60 + prev * 480;
      const y1 = 60 + val * 480;
      g.fillStyle = c;
      g.fillRect(i * cw + cw * 0.22, Math.min(y0, y1), cw * 0.56, Math.max(4, Math.abs(y1 - y0)));
      g.fillRect(i * cw + cw * 0.47, Math.min(y0, y1) - 10, cw * 0.06, Math.abs(y1 - y0) + 20);
    });
    g.fillStyle = '#0e1622';
    g.fillRect(0, 0, 1024, 44);
    g.fillStyle = col;
    g.font = `700 26px ${MONO}`;
    g.fillText('price · 1m', 20, 31);
  });

const feedTex = (s: ScreenState) =>
  canvasTex(1024, 576, (g) => {
    g.fillStyle = '#05080e';
    g.fillRect(0, 0, 1024, 576);
    g.fillStyle = '#0e1622';
    g.fillRect(0, 0, 1024, 44);
    g.fillStyle = '#7f8fa3';
    g.font = `700 26px ${MONO}`;
    g.fillText('feed', 20, 31);
    const rows = s.feed ?? ['new pool · liquidity —', 'new pool · liquidity —', 'swap · 0.4 SOL', 'new pool · liquidity —', 'swap · 1.2 SOL'];
    rows.forEach((r, i) => {
      const hi = i === 0 && (s.tone === 'warm' || s.tone === 'good' || s.tone === 'alert');
      g.fillStyle = hi ? 'rgba(255,181,71,0.14)' : i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0)';
      g.fillRect(14, 64 + i * 74, 996, 64);
      g.fillStyle = hi ? TONE[s.tone ?? 'warm'] : '#b8c6d6';
      g.font = `${hi ? 800 : 600} 34px ${MONO}`;
      g.fillText(r, 34, 108 + i * 74);
    });
  });

const keysTex = () =>
  canvasTex(512, 160, (g) => {
    g.fillStyle = '#15181d';
    g.fillRect(0, 0, 512, 160);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 15; c++) {
        g.fillStyle = r === 4 && c > 4 && c < 10 ? '#2a2f37' : '#252a31';
        if (r === 4 && c > 5 && c < 10) continue;
        g.fillRect(8 + c * 33.5, 8 + r * 30, 29, 25);
      }
    g.fillStyle = '#2a2f37';
    g.fillRect(8 + 5 * 33.5, 8 + 4 * 30, 33.5 * 5 - 4, 25);
  });

const cityTex = () =>
  canvasTex(1024, 512, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#04060c');
    grd.addColorStop(0.7, '#0c1428');
    grd.addColorStop(1, '#1b2340');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    let x = 0;
    let i = 0;
    while (x < 1024) {
      const w = 40 + rand(i + 3) * 70;
      const h = 120 + rand(i + 9) * 300;
      g.fillStyle = '#070b15';
      g.fillRect(x, 512 - h, w, h);
      for (let yy = 512 - h + 10; yy < 506; yy += 16)
        for (let xx = x + 6; xx < x + w - 8; xx += 12) if (rand(xx * 0.7 + yy * 1.3 + i) > 0.72) {
          g.fillStyle = rand(xx + yy) > 0.5 ? '#ffd38a' : '#9fc4ff';
          g.fillRect(xx, yy, 5, 7);
        }
      x += w + 4;
      i++;
    }
  });

const NameCard: React.FC<{p: number; name: string; role?: string; note?: string; y?: number}> = ({p, name, role, note, y = 1180}) => (
  <div style={{position: 'absolute', left: 90, width: 780, top: y, opacity: clamp01(p * 1.5), transform: `translateY(${(1 - p) * 34}px)`, fontFamily: theme.font}}>
    <div style={{display: 'flex', gap: 24, background: 'rgba(9,13,22,0.86)', border: '1.5px solid rgba(255,255,255,0.16)', borderRadius: 24, padding: '22px 30px', boxShadow: '0 18px 50px rgba(0,0,0,0.45)'}}>
      <div style={{width: 9, borderRadius: 5, background: '#3bc9ee', transform: `scaleY(${clamp01(p * 1.3)})`, transformOrigin: 'top'}} />
      <div>
        <div style={{fontSize: 62, fontWeight: 800, color: '#fff', letterSpacing: 1.5, lineHeight: 1.05}}>{name}</div>
        {role ? <div style={{fontSize: 33, fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginTop: 10}}>{role}</div> : null}
        {note ? <div style={{fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 12, letterSpacing: 2.5, textTransform: 'uppercase'}}>{note}</div> : null}
      </div>
    </div>
  </div>
);

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const POSES = ['type', 'mouse', 'click', 'lean', 'idle', 'look'];

export const Trader3D: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, at, p, has} = useClock(beats, acts);
  const col = {top: '#2c313b', legs: '#2b3a55', hair: '#1c1410', skin: '#c08a68', ...(props.colours ?? {})};
  const screens = props.screens ?? {};

  // ---- current screen state (latest screen:<x> action that has fired) ----
  let scr = props.screen ?? 'idle';
  let scrAt = -999;
  acts.forEach((a) => {
    if (!a.startsWith('screen:')) return;
    const f0 = at(a);
    if (f0 !== null && frame >= f0 && f0 >= scrAt) {
      scr = a.slice(7);
      scrAt = f0;
    }
  });
  const flash = scrAt > -999 ? Math.max(0, 1 - (frame - scrAt) / 7) : 0;
  const stateOf = (k: string): ScreenState => screens[k] ?? {head: k, big: '', tone: 'muted'};
  const allStates = useMemo(() => Array.from(new Set([props.screen ?? 'idle', ...acts.filter((a) => a.startsWith('screen:')).map((a) => a.slice(7))])), [props.screen, acts]);
  const texSet = useMemo(
    () =>
      Object.fromEntries(
        allStates.map((k, i) => {
          const s = stateOf(k);
          return [k, {c: centreTex(s), l: chartTex(s, i + 1), r: feedTex(s)}];
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allStates.join('|')],
  );
  const tex = texSet[scr] ?? texSet[allStates[0]];
  const tone = TONE[stateOf(scr).tone ?? 'accent'];

  // ---- pose: hand targets in body space (standing frame; the body is lowered by SEAT for sitting) ----
  type Pose = {rh: V3; lh: V3; head: number; turn: number; lean: number};
  const typ = (s: number) => 0.012 * Math.sin(frame * 1.45 + s * 2.1) + 0.006 * Math.sin(frame * 3.1 + s);
  const PS: Record<string, Pose> = {
    idle: {rh: [-0.2, 1.2, 0.36], lh: [0.2, 1.2, 0.36], head: 0.12 + 0.03 * Math.sin(frame / 37), turn: 0.04 * Math.sin(frame / 53), lean: 0.04},
    type: {rh: [-0.12, 1.205 + typ(1), 0.47], lh: [0.12, 1.205 + typ(2), 0.47], head: 0.14, turn: 0.03 * Math.sin(frame / 19), lean: 0.1},
    mouse: {rh: [-0.37, 1.195, 0.47], lh: [0.16, 1.2, 0.4], head: 0.12, turn: -0.12, lean: 0.08},
    click: {rh: [-0.37, 1.18 + 0.012 * Math.max(0, Math.sin(frame * 0.9)), 0.48], lh: [0.16, 1.2, 0.4], head: 0.1, turn: -0.05, lean: 0.12},
    lean: {rh: [-0.14, 1.67, -0.1], lh: [0.14, 1.67, -0.1], head: -0.14, turn: 0.02 * Math.sin(frame / 41), lean: -0.2},
    look: {rh: [-0.2, 1.2, 0.36], lh: [0.2, 1.2, 0.36], head: 0.02, turn: 0.95, lean: 0.0},
  };
  let pose: Pose = PS.idle;
  acts.forEach((a) => {
    if (!POSES.includes(a)) return;
    const f0 = at(a);
    if (f0 === null || frame < f0) return;
    const w = interpolate(frame, [f0, f0 + 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    const b = PS[a];
    pose = {
      rh: [lerp(pose.rh[0], b.rh[0], w), lerp(pose.rh[1], b.rh[1], w), lerp(pose.rh[2], b.rh[2], w)],
      lh: [lerp(pose.lh[0], b.lh[0], w), lerp(pose.lh[1], b.lh[1], w), lerp(pose.lh[2], b.lh[2], w)],
      head: lerp(pose.head, b.head, w),
      turn: lerp(pose.turn, b.turn, w),
      lean: lerp(pose.lean, b.lean, w),
    };
  });
  // keep typing alive if the latest pose is "type"
  const breathe = 0.006 * Math.sin(frame / 22);

  // ---- skeleton (seated) ----
  const HIP_Y = 0.93;
  const SEAT = 0.43;
  const T = 0.45;
  const legOf = (s: number) => {
    const hip = new THREE.Vector3(s * 0.1, HIP_Y, 0.02);
    const knee = new THREE.Vector3(s * 0.12, HIP_Y + 0.01, 0.02 + T);
    const ankle = new THREE.Vector3(s * 0.13, HIP_Y - 0.42, 0.55);
    return {hip, knee, ankle};
  };
  const Lr = legOf(-1);
  const Ll = legOf(1);
  const tilt = pose.lean + breathe;
  const pivot = new THREE.Vector3(0, HIP_Y, 0);
  const rot = (v: THREE.Vector3) => v.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt).add(pivot);
  const Sr = rot(new THREE.Vector3(-0.2, 1.43, 0));
  const Sl = rot(new THREE.Vector3(0.2, 1.43, 0));
  const R = solveArm(Sr, new THREE.Vector3(...pose.rh), new THREE.Vector3(-0.75, 0.95, -0.45));
  const Lf = solveArm(Sl, new THREE.Vector3(...pose.lh), new THREE.Vector3(0.75, 0.95, -0.45));

  // ---- materials ----
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({color: col.skin, roughness: 0.6}),
      hair: new THREE.MeshStandardMaterial({color: col.hair, roughness: 0.95}),
      top: new THREE.MeshStandardMaterial({color: col.top, roughness: 0.85}),
      topDark: new THREE.MeshStandardMaterial({color: new THREE.Color(col.top).multiplyScalar(0.7), roughness: 0.9}),
      legs: new THREE.MeshStandardMaterial({color: col.legs, roughness: 0.85}),
      shoe: new THREE.MeshStandardMaterial({color: '#e8e8e4', roughness: 0.6}),
      eye: new THREE.MeshStandardMaterial({color: '#141414', roughness: 0.3}),
      mouth: new THREE.MeshStandardMaterial({color: '#7a3b30', roughness: 0.6}),
      phones: new THREE.MeshStandardMaterial({color: '#15171b', roughness: 0.75, metalness: 0.1}),
      cushion: new THREE.MeshStandardMaterial({color: '#2a2c31', roughness: 0.6}),
      wood: new THREE.MeshStandardMaterial({color: '#3a2a20', roughness: 0.55}),
      deskTop: new THREE.MeshStandardMaterial({color: '#2b231e', roughness: 0.45, metalness: 0.05}),
      metal: new THREE.MeshStandardMaterial({color: '#8a929d', metalness: 0.85, roughness: 0.32}),
      dark: new THREE.MeshStandardMaterial({color: '#111318', roughness: 0.5, metalness: 0.2}),
      bezel: new THREE.MeshStandardMaterial({color: '#0b0d11', roughness: 0.7, metalness: 0.2}),
      chair: new THREE.MeshStandardMaterial({color: '#1d2026', roughness: 0.7}),
      floor: new THREE.MeshStandardMaterial({color: '#191b20', roughness: 0.85}),
      wall: new THREE.MeshStandardMaterial({color: '#1a1f2b', roughness: 0.95}),
      mug: new THREE.MeshStandardMaterial({color: '#e9e5dc', roughness: 0.4}),
      lampShade: new THREE.MeshStandardMaterial({color: '#2b2f36', roughness: 0.4, metalness: 0.6}),
      bulb: new THREE.MeshStandardMaterial({color: '#ffe2a8', emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 2.6, toneMapped: false}),
      frame: new THREE.MeshStandardMaterial({color: '#20242c', roughness: 0.6}),
    }),
    [col.skin, col.hair, col.top, col.legs],
  );
  const geos = useMemo(
    () => ({
      torso: new RoundedBoxGeometry(0.4, 0.52, 0.25, 4, 0.1),
      hip: new RoundedBoxGeometry(0.36, 0.2, 0.3, 3, 0.08),
      shoe: new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03),
      seat: new RoundedBoxGeometry(0.52, 0.08, 0.5, 4, 0.035),
      back: new RoundedBoxGeometry(0.48, 0.62, 0.07, 4, 0.03),
      monitor: new RoundedBoxGeometry(0.64, 0.38, 0.03, 3, 0.01),
      keyboard: new RoundedBoxGeometry(0.44, 0.022, 0.15, 3, 0.008),
      mouse: new RoundedBoxGeometry(0.06, 0.03, 0.1, 3, 0.014),
      hood: new RoundedBoxGeometry(0.34, 0.12, 0.2, 3, 0.05),
    }),
    [],
  );
  const keys = useMemo(() => keysTex(), []);
  const city = useMemo(() => cityTex(), []);

  // ---- camera ----
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [-0.8, 1.5, -1.25], look: [0.05, 1.1, 0.95], fov: 34});

  // ---- overlay ----
  const cardP = p('card', 14, Easing.out(Easing.cubic));
  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))) * (1 - p(`hide:${i}`, 8)));
  const ctr = props.counter;
  const cntP = has('count') ? p('count', 26, Easing.out(Easing.cubic)) : 0;
  const cntShow = has('count') ? clamp01(p('count', 8)) : 0;
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {ctr && cntShow > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: ctr.y ?? 520, textAlign: 'center', fontFamily: theme.font, opacity: cntShow, transform: `translateY(${(1 - cntShow) * 20}px)`}}>
          <div style={{fontSize: ctr.size ?? 132, fontWeight: 900, color: '#ffffff', letterSpacing: -2, textShadow: '0 6px 30px rgba(0,0,0,0.85), 0 0 40px rgba(59,201,238,0.35)'}}>
            {(ctr.prefix ?? '') + fmt(lerp(ctr.from ?? 0, ctr.to, cntP)) + (ctr.suffix ?? '')}
          </div>
          {ctr.label ? <div style={{fontSize: 40, fontWeight: 800, color: '#3bc9ee', letterSpacing: 3, textTransform: 'uppercase', marginTop: 6, textShadow: '0 2px 14px rgba(0,0,0,0.9)'}}>{ctr.label}</div> : null}
        </div>
      ) : null}
      {props.card && cardP > 0 ? <NameCard p={cardP} {...props.card} /> : null}
      {props.caption ? <Caption text={props.caption} y={1500} /> : null}
    </>
  );

  // monitors: centre + two angled
  const MON: {pos: V3; ry: number; k: 'c' | 'l' | 'r'}[] = [
    {pos: [0, 1.13, 0.99], ry: Math.PI, k: 'c'},
    {pos: [0.69, 1.13, 0.86], ry: Math.PI + 0.48, k: 'l'},
    {pos: [-0.69, 1.13, 0.86], ry: Math.PI - 0.48, k: 'r'},
  ];
  const lampOn = props.lamp ?? true;
  const glowCol = new THREE.Color('#9fd8ff').lerp(new THREE.Color(tone), 0.35);

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.95} warm={0.12}>
      <fog attach="fog" args={['#0a0d14', 5, 14]} />
      {/* room */}
      <mesh material={mats.floor} position={[0, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
      </mesh>
      <mesh material={mats.wall} position={[0, 2, 1.75]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 5]} />
      </mesh>
      {/* window onto a city, behind the monitors */}
      <mesh position={[0.15, 1.62, 1.735]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.9, 1.25]} />
        <meshBasicMaterial map={city ?? undefined} toneMapped={false} />
      </mesh>
      {([[-1.3, 1.62, 0.05, 1.3], [1.6, 1.62, 0.05, 1.3], [0.15, 1.62, 0.04, 1.25], [0.15, 2.255, 2.95, 0.05], [0.15, 0.985, 2.95, 0.05]] as number[][]).map(([x, y, w, h], i) => (
        <mesh key={i} material={mats.frame} position={[x, y, 1.72]}>
          <boxGeometry args={[w, h, 0.05]} />
        </mesh>
      ))}
      {/* desk */}
      <mesh material={mats.deskTop} position={[0, 0.72, 0.74]}>
        <boxGeometry args={[1.95, 0.05, 0.78]} />
      </mesh>
      {[[-0.92, 0.36, 0.42], [0.92, 0.36, 0.42], [-0.92, 0.36, 1.08], [0.92, 0.36, 1.08]].map((v, i) => (
        <mesh key={i} material={mats.dark} position={v as V3}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
        </mesh>
      ))}
      {/* monitors */}
      {MON.map((m, i) => (
        <group key={i} position={m.pos} rotation={[0, m.ry, 0]}>
          <mesh geometry={geos.monitor} material={mats.bezel} position={[0, 0, -0.017]} />
          <mesh position={[0, 0, 0.0015]}>
            <planeGeometry args={[0.6, 0.338]} />
            <meshBasicMaterial map={(m.k === 'c' ? tex?.c : m.k === 'l' ? tex?.l : tex?.r) ?? undefined} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(1 + flash * 1.6)} />
          </mesh>
          {/* stand */}
          <mesh material={mats.metal} position={[0, -0.27, -0.06]}>
            <boxGeometry args={[0.04, 0.2, 0.025]} />
          </mesh>
          <mesh material={mats.metal} position={[0, -0.375, -0.06]}>
            <boxGeometry args={[0.2, 0.012, 0.14]} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 1.16, 0.82]} intensity={1.0 + flash * 2.0} distance={2.6} decay={1.6} color={glowCol} />
      <pointLight position={[0.62, 1.15, 0.74]} intensity={0.45 + flash * 1.0} distance={2.0} decay={1.6} color={glowCol} />
      <pointLight position={[-0.62, 1.15, 0.74]} intensity={0.45 + flash * 1.0} distance={2.0} decay={1.6} color={glowCol} />
      {/* keyboard, mouse, mug, lamp */}
      <mesh geometry={geos.keyboard} material={mats.dark} position={[0, 0.756, 0.47]} />
      <mesh position={[0, 0.768, 0.47]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 0.135]} />
        <meshStandardMaterial map={keys ?? undefined} roughness={0.6} />
      </mesh>
      <mesh geometry={geos.mouse} material={mats.dark} position={[-0.37, 0.762, 0.47]} />
      <group position={[0.46, 0.745, 0.56]}>
        <mesh material={mats.mug} position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.04, 0.036, 0.11, 18]} />
        </mesh>
        <mesh material={mats.mug} position={[0.045, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.025, 0.007, 8, 14]} />
        </mesh>
      </group>
      {lampOn ? (
        <group position={[-0.82, 0.745, 0.95]}>
          <mesh material={mats.lampShade} position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.02, 20]} />
          </mesh>
          <mesh material={mats.lampShade} position={[0.02, 0.22, -0.02]} rotation={[0, 0, -0.18]}>
            <cylinderGeometry args={[0.01, 0.01, 0.44, 8]} />
          </mesh>
          <mesh material={mats.lampShade} position={[0.12, 0.43, 0.0]} rotation={[0, 0, 0.9]}>
            <coneGeometry args={[0.07, 0.12, 20, 1, true]} />
          </mesh>
          <mesh material={mats.bulb} position={[0.15, 0.4, 0.0]}>
            <sphereGeometry args={[0.025, 10, 8]} />
          </mesh>
          <pointLight position={[0.18, 0.36, -0.05]} intensity={1.4} distance={2.4} color="#ffc27a" />
        </group>
      ) : null}
      {/* chair */}
      <group position={[0, 0, 0]}>
        <mesh geometry={geos.seat} material={mats.chair} position={[0, 0.445, 0.04]} />
        <mesh geometry={geos.back} material={mats.chair} position={[0, 0.86, -0.27]} rotation={[-0.12 + Math.min(0, tilt) * 0.6, 0, 0]} />
        <mesh material={mats.metal} position={[0, 0.27, 0.0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.32, 10]} />
        </mesh>
        {Array.from({length: 5}).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 + 0.3;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh material={mats.dark} position={[0.17, 0.08, 0]}>
                <boxGeometry args={[0.32, 0.03, 0.045]} />
              </mesh>
              <mesh material={mats.dark} position={[0.32, 0.03, 0]}>
                <sphereGeometry args={[0.03, 10, 8]} />
              </mesh>
            </group>
          );
        })}
      </group>
      <BlobShadow w={1.3} d={1.1} opacity={0.6} position={[0, 0.004, 0.2]} />

      {/* ---- the person (body space lowered by SEAT) ---- */}
      <group position={[0, -SEAT, 0]}>
        {[Lr, Ll].map((L, i) => (
          <group key={i}>
            <Bone a={L.hip} b={L.knee} r={0.078} mat={mats.legs} />
            <Bone a={L.knee} b={L.ankle} r={0.06} mat={mats.legs} />
            <mesh geometry={geos.shoe} material={mats.shoe} position={[L.ankle.x, L.ankle.y - 0.035, L.ankle.z + 0.06]} />
          </group>
        ))}
        <mesh geometry={geos.hip} material={mats.legs} position={[0, HIP_Y + 0.02, 0.03]} />
        <group position={pivot} rotation={[tilt, 0, 0]}>
          <group position={[0, -HIP_Y, 0]}>
            <mesh geometry={geos.torso} material={mats.top} position={[0, 1.24, 0]} />
            {/* hood resting on the shoulders */}
            <mesh geometry={geos.hood} material={mats.topDark} position={[0, 1.5, -0.07]} />
            <mesh material={mats.skin} position={[0, 1.54, 0]}>
              <cylinderGeometry args={[0.046, 0.052, 0.1, 12]} />
            </mesh>
            <group position={[0, 1.6, 0]} rotation={[pose.head, pose.turn, 0]}>
              <mesh material={mats.skin} position={[0, 0.075, 0.01]} scale={[0.9, 1.1, 0.98]}>
                <sphereGeometry args={[0.1, 28, 20]} />
              </mesh>
              {/* short hair: a cap tilted back (covers crown and back, leaves the forehead) */}
              <group position={[0, 0.078, -0.01]} rotation={[-0.32, 0, 0]}>
                <mesh material={mats.hair} scale={[0.96, 1.0, 1.02]}>
                  <sphereGeometry args={[0.116, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                </mesh>
              </group>
              {/* headphones: thin band + small padded cups */}
              <mesh material={mats.phones} position={[0, 0.088, -0.01]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.113, 0.008, 8, 30, Math.PI]} />
              </mesh>
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.103, 0.055, -0.005]} rotation={[0, 0, Math.PI / 2]}>
                  <mesh material={mats.phones}>
                    <cylinderGeometry args={[0.034, 0.036, 0.024, 20]} />
                  </mesh>
                  <mesh material={mats.cushion} position={[0, s * -0.014, 0]}>
                    <torusGeometry args={[0.028, 0.009, 8, 18]} />
                  </mesh>
                </group>
              ))}
              {/* face */}
              {[-1, 1].map((s) => (
                <group key={s}>
                  <mesh material={mats.eye} position={[s * 0.034, 0.075, 0.09]} scale={[1, (frame + 23) % 120 < 4 ? 0.15 : 1.2, 0.6]}>
                    <sphereGeometry args={[0.0142, 10, 8]} />
                  </mesh>
                  <mesh material={mats.hair} position={[s * 0.036, 0.103, 0.093]} rotation={[0, 0, s * -0.1]}>
                    <boxGeometry args={[0.036, 0.008, 0.01]} />
                  </mesh>
                </group>
              ))}
              <mesh material={mats.mouth} position={[0, 0.02, 0.094]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.004, 0.024, 3, 6]} />
              </mesh>
              <mesh material={mats.skin} position={[0, 0.052, 0.102]}>
                <sphereGeometry args={[0.015, 8, 6]} />
              </mesh>
              {/* stubble shadow */}
              <mesh position={[0, 0.03, 0.06]} scale={[0.85, 0.55, 0.62]}>
                <sphereGeometry args={[0.09, 20, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4]} />
                <meshStandardMaterial color="#3a2a22" roughness={0.9} transparent opacity={0.22} />
              </mesh>
            </group>
          </group>
        </group>
        {/* arms */}
        {[
          {Sh: Sr, A: R},
          {Sh: Sl, A: Lf},
        ].map(({Sh, A}, i) => (
          <group key={i}>
            <mesh material={mats.top} position={Sh}>
              <sphereGeometry args={[0.075, 12, 10]} />
            </mesh>
            <Bone a={Sh} b={A.E} r={0.058} mat={mats.top} />
            <Bone a={A.E} b={A.H} r={0.048} mat={mats.top} />
            <mesh material={mats.skin} position={A.H.clone().add(A.H.clone().sub(A.E).normalize().multiplyScalar(0.045))} scale={[0.85, 0.7, 1.05]}>
              <sphereGeometry args={[0.05, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </Studio>
  );
};
